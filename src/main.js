// APIキーは .env.local の VITE_TMDB_API_KEY から読み込む
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// 気分タイプの表示ラベル（結果表示用）
const VIBE_LABELS = {
    romantic:    '💕 ロマンチック気分',
    intense:     '⚡ 興奮・サスペンス気分',
    thoughtful:  '🤔 深く考えたい気分',
    relaxing:    '😌 ゆったり気分',
    adventurous: '🗺️ 冒険心をくすぐられたい気分',
    dark:        '🌙 ダークな世界観気分',
};

// 各サブスクの検索 URL（タイトル検索）
const PROVIDER_WATCH_URLS = {
    8:   (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    84:  (title) => `https://video.unext.jp/search?q=${encodeURIComponent(title)}`,
    85:  (title) => `https://animestore.docomo.ne.jp/animestore/sch_pc?searchKey=${encodeURIComponent(title)}`,
    119: (title) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}&i=prime-video`,
    337: (title) => `https://www.disneyplus.com/ja-jp/search?q=${encodeURIComponent(title)}`,
    356: (title) => `https://www.hulu.jp/search?query=${encodeURIComponent(title)}`,
};

/**
 * 作品IDから日本で配信しているフラットレート（サブスク）プロバイダーを取得する。
 * 失敗しても空配列を返してガチャ結果表示は続行する。
 */
async function fetchWatchProviders(type, itemId) {
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/${type}/${itemId}/watch/providers?api_key=${TMDB_API_KEY}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.results?.JP?.flatrate ?? [];
    } catch {
        return [];
    }
}

/**
 * 作品IDから YouTube の予告映像キーを取得する。
 * 日本語 → 英語の順で Trailer/Teaser を探す。
 * 見つからなければ null を返す。
 */
async function fetchTrailerKey(type, itemId) {
    try {
        // まず日本語で検索
        const jaRes = await fetch(
            `https://api.themoviedb.org/3/${type}/${itemId}/videos?api_key=${TMDB_API_KEY}&language=ja-JP`
        );
        if (jaRes.ok) {
            const jaData = await jaRes.json();
            const jaTrailer = pickBestVideo(jaData.results ?? []);
            if (jaTrailer) return jaTrailer;
        }
        // 日本語になければ英語で再検索
        const enRes = await fetch(
            `https://api.themoviedb.org/3/${type}/${itemId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!enRes.ok) return null;
        const enData = await enRes.json();
        return pickBestVideo(enData.results ?? []);
    } catch {
        return null;
    }
}

/**
 * 動画リストから最優先の YouTube Trailer/Teaser を返す。
 * 優先順: Trailer(公式) > Teaser > Clip
 */
function pickBestVideo(videos) {
    const ytVideos = videos.filter(v => v.site === 'YouTube');
    return (
        ytVideos.find(v => v.type === 'Trailer') ??
        ytVideos.find(v => v.type === 'Teaser')  ??
        ytVideos.find(v => v.type === 'Clip')    ??
        null
    );
}

/**
 * 視聴リンクボタンを描画する。
 */
function renderWatchLinks(providers, selectedIds, title) {
    const container = document.getElementById('res-watch-links');
    container.innerHTML = '';

    const matched = providers.filter(p => selectedIds.has(p.provider_id) && PROVIDER_WATCH_URLS[p.provider_id]);

    if (matched.length === 0) {
        container.style.display = 'none';
        return;
    }

    const heading = document.createElement('p');
    heading.className = 'watch-heading';
    heading.textContent = '▶ 今すぐ視聴';
    container.appendChild(heading);

    matched.forEach(provider => {
        const a = document.createElement('a');
        a.href = PROVIDER_WATCH_URLS[provider.provider_id](title);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'provider-link';

        if (provider.logo_path) {
            const img = document.createElement('img');
            img.src = `https://image.tmdb.org/t/p/original${provider.logo_path}`;
            img.alt = provider.provider_name;
            img.className = 'provider-logo';
            a.appendChild(img);
        }

        const span = document.createElement('span');
        span.textContent = `${provider.provider_name} で見る`;
        a.appendChild(span);

        container.appendChild(a);
    });

    container.style.display = 'block';
}

/**
 * 予告映像エリアを描画する。
 * TMDb の動画キーは地域制限で再生不可の場合があるため、
 * サムネイル表示には動画キーを使いつつ、リンク先は YouTube 検索にする。
 * これにより地域・年齢・削除などの制限を回避できる。
 *
 * @param {string|null} trailerKey  TMDb から取得した YouTube 動画キー
 * @param {string}      title       作品タイトル（検索クエリに使用）
 */
function renderTrailer(trailerKey, title) {
    const section = document.getElementById('res-trailer');
    section.innerHTML = '';

    // trailerKey がなくてもタイトルがあれば検索リンクだけ表示できる
    if (!trailerKey && !title) {
        section.style.display = 'none';
        return;
    }

    // YouTube 検索 URL（タイトル + "予告" で検索）
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' 予告 trailer')}`;

    if (trailerKey) {
        // サムネイル (maxresdefault → hqdefault へ img.onerror でフォールバック)
        const link = document.createElement('a');
        link.href = searchUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'trailer-thumb-link';
        link.title = 'YouTube で予告映像を検索する';

        const thumb = document.createElement('img');
        thumb.src = `https://img.youtube.com/vi/${trailerKey}/maxresdefault.jpg`;
        thumb.alt = '予告映像';
        thumb.className = 'trailer-thumb';
        thumb.onerror = () => {
            thumb.onerror = null;
            thumb.src = `https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg`;
        };

        const playIcon = document.createElement('span');
        playIcon.className = 'trailer-play-icon';
        playIcon.textContent = '▶';

        link.appendChild(thumb);
        link.appendChild(playIcon);
        section.appendChild(link);
    }

    // 検索リンクのキャプション
    const caption = document.createElement('p');
    caption.className = 'trailer-caption';
    caption.innerHTML = `🎬 <a href="${searchUrl}" target="_blank" rel="noopener noreferrer">「${title} 予告」を YouTube で検索する</a>`;
    section.appendChild(caption);

    section.style.display = 'block';
}

async function rollGacha() {
    if (!TMDB_API_KEY) {
        alert('.env.local に VITE_TMDB_API_KEY が設定されていません。\n.env.example を参考に .env.local を作成してください。');
        return;
    }

    const btn       = document.getElementById('gacha-btn');
    const loading   = document.getElementById('loading');
    const resultDiv = document.getElementById('result');

    const checkboxes = document.querySelectorAll('#providers input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        alert('サブスクを1つ以上選んでください！');
        return;
    }
    const selectedProviderIds = new Set(Array.from(checkboxes).map(cb => Number(cb.value)));
    const providerIds = [...selectedProviderIds].join('|');

    const type    = document.getElementById('mood-energy').value;
    const genreId = document.getElementById('mood-genre').value;
    const vibe    = document.getElementById('mood-vibe').value;
    const filter  = document.getElementById('mood-filter').value;

    if (!genreId) { alert('ジャンルを選択してください！'); return; }
    if (!filter)  { alert('フィルタを選択してください！'); return; }

    btn.style.display       = 'none';
    resultDiv.style.display = 'none';
    loading.style.display   = 'block';

    try {
        let sortBy = 'popularity.desc';
        let voteAverageGte = 0;
        let page = (filter === 'random') ? Math.floor(Math.random() * 5) + 1 : 1;

        if (filter === 'vote_average') {
            sortBy = 'vote_average.desc';
            voteAverageGte = 7;
        } else if (filter === 'release_date') {
            sortBy = 'release_date.desc';
        }

        let url = `https://api.themoviedb.org/3/discover/${type}`
            + `?api_key=${TMDB_API_KEY}`
            + `&language=ja-JP`
            + `&watch_region=JP`
            + `&with_watch_providers=${providerIds}`
            + `&with_watch_provider_types=flatrate`
            + `&with_genres=${genreId}`
            + `&sort_by=${sortBy}`
            + `&page=${page}`;

        if (voteAverageGte > 0) {
            url += `&vote_average.gte=${voteAverageGte}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.status_message ?? `HTTP エラー ${response.status}`);
        }

        if (data.results && data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const item = data.results[randomIndex];
            const title = item.title || item.name;

            document.getElementById('res-title').textContent = title;

            const releaseDate = item.release_date || item.first_air_date;
            const year = releaseDate ? releaseDate.substring(0, 4) : '不明';
            const rating = (item.vote_average != null && item.vote_average !== 0)
                ? `⭐ ${item.vote_average.toFixed(1)}`
                : '未評価';
            const typeText = type === 'movie' ? '🎬 映画' : '📺 TV/アニメ';
            document.getElementById('res-info').textContent = `${typeText} | 公開: ${year} | ${rating}`;

            document.getElementById('res-overview').textContent =
                item.overview || '（あらすじ情報がありません。とりあえず見てみましょう！）';

            const vibeEl = document.getElementById('res-vibe');
            vibeEl.textContent = (vibe && VIBE_LABELS[vibe]) ? `${VIBE_LABELS[vibe]} のおすすめ` : '';
            vibeEl.style.display = (vibe && VIBE_LABELS[vibe]) ? 'block' : 'none';

            const poster = document.getElementById('res-poster');
            if (item.poster_path) {
                poster.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                poster.style.display = 'inline-block';
            } else {
                poster.src = '';
                poster.style.display = 'none';
            }

            resultDiv.style.display = 'block';
            btn.textContent = 'もう一度回す';

            // 視聴リンク・予告映像を並列取得（どちらか失敗しても結果表示は継続）
            const [watchProviders, trailerKey] = await Promise.all([
                fetchWatchProviders(type, item.id),
                fetchTrailerKey(type, item.id),
            ]);
            renderWatchLinks(watchProviders, selectedProviderIds, title);
            renderTrailer(trailerKey, title);

        } else {
            alert('条件に合う作品が見つかりませんでした。別のサブスクや気分を選んでみてください！');
        }
    } catch (error) {
        console.error(error);
        alert(`エラーが発生しました。\n${error.message}`);
    } finally {
        loading.style.display = 'none';
        btn.style.display = 'block';
    }
}

document.getElementById('gacha-btn').addEventListener('click', rollGacha);
