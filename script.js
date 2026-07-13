

// ============ GitHub Gist 云端存储配置（Token存浏览器，安全 & 免费）============
const GITHUB_CONFIG = {
    fileName: "ielts_data.json",
    get token() {
        let t = localStorage.getItem("gh_token");
        if (!t) {
            t = prompt("首次使用，请粘贴你的 GitHub Token（github_pat_ 开头）：\n\n填一次即可，浏览器会永久记住。");
            if (t) localStorage.setItem("gh_token", t.trim());
        }
        return t;
    },
    get gistId() {
        let g = localStorage.getItem("gh_gist_id");
        if (!g) {
            g = prompt("请粘贴你的 Gist ID（Gist 网址中用户名后面那一长串字母数字）：");
            if (g) localStorage.setItem("gh_gist_id", g.trim());
        }
        return g;
    }
};
function isLoggedIn() {
    const token = localStorage.getItem("gh_token");
    const gistId = localStorage.getItem("gh_gist_id");
    return !!(token && gistId);
}
// 获取并显示用户昵称
function updateWelcomeText() {
    let nickname = localStorage.getItem("ielts_user_nickname");

    if (!nickname) {
        nickname = prompt("请输入你的学习昵称，例如：Ryann");
        if (nickname) {
            nickname = nickname.trim();
            localStorage.setItem("ielts_user_nickname", nickname);
        }
    }

    const welcomeEl = document.getElementById("welcomeText");
    const brandSubEl = document.getElementById("brandSubText");
    const loginBtn = document.getElementById("loginBtn");
    const userChip = document.getElementById("userChip");
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");

    if (welcomeEl && nickname) {
        welcomeEl.innerText = `${nickname} 你好，欢迎来到雅思学习平台`;
    }

    if (brandSubEl && nickname) {
        brandSubEl.innerText = `${nickname}'s Study Space`;
    }

    if (loginBtn && userChip && nickname) {
        loginBtn.style.display = "none";
        userChip.style.display = "flex";
    }

    if (userAvatar && nickname) {
        userAvatar.innerText = nickname.slice(0, 1).toUpperCase();
    }

    if (userName && nickname) {
        userName.innerText = nickname;
    }
}
function resetGitHubConfig() {
    if (confirm("确认退出当前账号？\n\n退出后需要重新登录，学习昵称也会清除。云端学习数据不会丢失。")) {
        localStorage.removeItem("gh_token");
        localStorage.removeItem("gh_gist_id");
        localStorage.removeItem("ielts_user_nickname");

        const welcomeEl = document.getElementById("welcomeText");
        const brandSubEl = document.getElementById("brandSubText");
        const loginBtn = document.getElementById("loginBtn");
        const userChip = document.getElementById("userChip");

        if (welcomeEl) {
            welcomeEl.innerText = "欢迎登录，开启你的今日雅思学习";
        }

        if (brandSubEl) {
            brandSubEl.innerText = "Welcome to Study Space";
        }

        if (loginBtn) {
            loginBtn.style.display = "block";
        }

        if (userChip) {
            userChip.style.display = "none";
        }

        alert("已退出登录。请重新点击【登录账号】。");
    }
}

// 全局学习进度存储

let cloudDataLoaded = false; 
        
let cloudStudyData = {
    learnedWords: [],
    d1ReviewWords: [],
    d3ReviewWords: [],
    learnedSentences: [],
    lastStudyDate: "",
    todayWords: [],
    todaySentences: [],
    todayReviewD1: [],      // 今天页面显示用的 D-1 快照
    todayReviewD3: [],      // 今天页面显示用的 D-3 快照
    history: {}
};



const topicExamplePool = {
    environment: [
        "Strict policy can effectively curtail industrial toxic discharge.",
        "Long-term chemical pollution turns once fertile farmland barren."
    ],
    society: [
        "Citizens have the right to assert their legitimate public interests.",
        "Unbalanced resource allocation may alienate low-income groups."
    ],
    study: [
        "Researchers collate thousands of samples to depict pollution trends.",
        "This core skill is crucial for academic paper writing."
    ],
    science: [
        "Scientists contrive new composite materials to replace plastic.",
        "Special testing apparatus is used to measure underground water quality."
    ],
    economy: [
        "Financial subsidies bolster small manufacturers’ green transformation.",
        "Investment in clean energy helps buoy regional economic growth."
    ],
    policy: [
        "The official document delineates clear emission limits for factories.",
        "Enterprises that breach environmental laws will deduct financial allowances."
    ],
    general: [
        "There is a broad global consensus on carbon emission reduction.",
        "A coherent set of rules is the backbone of effective governance."
    ]
};

// 加载云端学习记录（从 GitHub Gist 读取）
async function initCloudData(autoStart) {
    document.getElementById("syncStatus").innerText = "同步状态：正在从 GitHub 拉取数据...";
    
    try {
        const res = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            headers: {
                "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
                "Accept": "application/vnd.github+json"
            }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}：${res.statusText}`);
        const gist = await res.json();
        const fileContent = gist.files[GITHUB_CONFIG.fileName].content;
        cloudStudyData = JSON.parse(fileContent);

        // 兼容老数据：缺字段自动补上
        if (!cloudStudyData.learnedWords) cloudStudyData.learnedWords = [];
        if (!cloudStudyData.d1ReviewWords) cloudStudyData.d1ReviewWords = [];
        if (!cloudStudyData.d3ReviewWords) cloudStudyData.d3ReviewWords = [];
        if (!cloudStudyData.learnedSentences) cloudStudyData.learnedSentences = [];
        if (!cloudStudyData.lastStudyDate) cloudStudyData.lastStudyDate = "";
        if (!cloudStudyData.todayWords) cloudStudyData.todayWords = [];
        if (!cloudStudyData.todaySentences) cloudStudyData.todaySentences = [];
        if (!cloudStudyData.todayReviewD1) cloudStudyData.todayReviewD1 = [];
        if (!cloudStudyData.todayReviewD3) cloudStudyData.todayReviewD3 = [];
        if (!cloudStudyData.history) cloudStudyData.history = {};


        document.getElementById("syncStatus").innerText = "同步状态：云端数据加载完成";
        cloudDataLoaded = true;
        updateWelcomeText();

        if (autoStart) {
            autoStartTodayLearning();
        } else {
            alert("云端学习记录读取完毕，可以开始今日学习");
        }

    } catch (err) {
        document.getElementById("syncStatus").innerText = "同步失败：" + err.message;
        alert("云端读取失败：" + err.message + "\n\n请检查：\n1. Token 是否填对\n2. Gist ID 是否填对\n3. Token 是否有 gist 读写权限");
        console.error(err);
    }
}

// 保存进度到云端（更新 GitHub Gist）
async function saveProgressToCloud() {    
if (!isLoggedIn()) {
        alert("请先登录账号，再保存学习进度。");
        return;
    }

if (!cloudDataLoaded) {
    alert("请先点击【登录账号】，加载云端学习记录后再保存进度。");
    return;
}
    
    document.getElementById("syncStatus").innerText = "同步状态：正在上传到 GitHub...";
    try {
        const res = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                files: {
                    [GITHUB_CONFIG.fileName]: {
                        content: JSON.stringify(cloudStudyData, null, 2)
                    }
                }
            })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}：${res.statusText}`);
        document.getElementById("syncStatus").innerText = "同步状态：进度已保存至云端 ✅";
        alert("今日学习进度已同步到 GitHub 云端 💾\n其他设备打开网页即可读取到最新进度。");
    } catch (err) {
        document.getElementById("syncStatus").innerText = "保存失败：" + err.message;
        alert("云端保存失败：" + err.message);
        console.error(err);
    }
}

function showStudyPanel(type, btn) {
    if (!isLoggedIn()) {
        alert("请先登录账号，再查看学习内容。");
        return;
    }

    
var sections = [
    "homeSec",
    "searchResultSec",
    "rev1",
    "rev3",
    "newWordSec",
    "sentSec",
    "weakWordsSec",
    "planSec",
    "historySec"
];


    sections.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
        }
    });

    if (type === "home") {
        document.getElementById("homeSec").style.display = "flex";
    }

    if (type === "review") {
        document.getElementById("rev1").style.display = "block";
        document.getElementById("rev3").style.display = "block";
    }

    if (type === "words") {
        document.getElementById("newWordSec").style.display = "block";

        if (cloudStudyData.todayWords && cloudStudyData.todayWords.length > 0) {
            renderNewWordList(cloudStudyData.todayWords);
        } else {
            document.getElementById("newWordList").innerHTML =
                '<div class="word-item" style="color:#8b8f97;">今天还没有生成单词，请先点击「开始今日学习」。</div>';
        }
    }

    if (type === "sentences") {
        document.getElementById("sentSec").style.display = "block";

        if (!cloudStudyData.todaySentences || cloudStudyData.todaySentences.length === 0) {
            document.getElementById("sentArea").innerHTML =
                '<div class="word-item" style="color:#8b8f97;">今天还没有生成长难句，请先点击「开始今日学习」。</div>';
        }
    }

    if (type === "weakWords") {
        document.getElementById("weakWordsSec").style.display = "block";
        renderWeakWordsList();
    }

    if (type === "plan") {
        document.getElementById("planSec").style.display = "block";
        loadStudyPlanToInputs();
    }

    document.querySelectorAll(".nav-item").forEach(function(item) {
        item.classList.remove("active");
    });

    if (btn) {
        btn.classList.add("active");
    }
}
function getStudyPlan() {
    if (!cloudStudyData.studyPlan) {
        cloudStudyData.studyPlan = {
            newWordCount: 25,
            sentenceCount: 5
        };
    }

    return cloudStudyData.studyPlan;
}

// 把学习计划显示到输入框里
function loadStudyPlanToInputs() {
    const plan = getStudyPlan();

    const wordInput = document.getElementById("newWordCountInput");
    const sentenceInput = document.getElementById("sentenceCountInput");

    if (wordInput) {
        wordInput.value = plan.newWordCount || 25;
    }

    if (sentenceInput) {
        sentenceInput.value = plan.sentenceCount || 5;
    }
}

// 保存学习计划
function saveStudyPlan() {
    const wordInput = document.getElementById("newWordCountInput");
    const sentenceInput = document.getElementById("sentenceCountInput");

    const wordCount = Number(wordInput.value);
    const sentenceCount = Number(sentenceInput.value);

    if (wordCount < 5 || wordCount > 100) {
        alert("每日新单词数量建议设置在 5 到 100 之间。");
        return;
    }

    if (sentenceCount < 1 || sentenceCount > 20) {
        alert("每日长难句数量建议设置在 1 到 20 之间。");
        return;
    }

    cloudStudyData.studyPlan = {
        newWordCount: wordCount,
        sentenceCount: sentenceCount
    };

    alert("学习计划已保存。记得点击【保存进度】同步到云端。");
}

function showStudyPanel(type, btn) {
    if (!isLoggedIn()) {
        alert("请先登录账号，再查看学习内容。");
        return;
    }

    var sections = [
        "homeSec",
        "rev1",
        "rev3",
        "newWordSec",
        "sentSec",
        "weakWordsSec",
        "planSec",
        "historySec"
    ];

    sections.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    if (type === "home") {
        document.getElementById("homeSec").style.display = "flex";
    }

    if (type === "review") {
        document.getElementById("rev1").style.display = "block";
        document.getElementById("rev3").style.display = "block";
    }

    if (type === "words") {
        document.getElementById("newWordSec").style.display = "block";

        if (cloudStudyData.todayWords && cloudStudyData.todayWords.length > 0) {
            renderNewWordList(cloudStudyData.todayWords);
        } else {
            document.getElementById("newWordList").innerHTML =
                '<div class="word-item" style="color:#8b8f97;">今天还没有生成单词，请先点击「开始今日学习」。</div>';
        }
    }

    if (type === "sentences") {
        document.getElementById("sentSec").style.display = "block";

        if (!cloudStudyData.todaySentences || cloudStudyData.todaySentences.length === 0) {
            document.getElementById("sentArea").innerHTML =
                '<div class="word-item" style="color:#8b8f97;">今天还没有生成长难句，请先点击「开始今日学习」。</div>';
        }
    }

    if (type === "weakWords") {
        document.getElementById("weakWordsSec").style.display = "block";
        renderWeakWordsList();
    }

    if (type === "plan") {
        document.getElementById("planSec").style.display = "block";
        loadStudyPlanToInputs();
    }

    document.querySelectorAll(".nav-item").forEach(function(item) {
        item.classList.remove("active");
    });

    if (btn) btn.classList.add("active");
}

function getUniqueNewWord(count) {
    const unused = fullWordBank.filter(item => !cloudStudyData.learnedWords.includes(item.word));
    const randomPick = unused.sort(() => Math.random() - 0.5).slice(0, count);
    return randomPick;
}

function handleSearchEnter(event) {
    if (event.key === "Enter") {
        searchLearnedWord();
    }
}

function getWordStatusText(word) {
    if (!cloudStudyData.wordStatus || !cloudStudyData.wordStatus[word]) {
        return "未标记";
    }

    var status = cloudStudyData.wordStatus[word];

    if (status === "unfamiliar") return "陌生";
    if (status === "fuzzy") return "模糊";
    if (status === "familiar") return "熟悉";

    return "未标记";
}

function searchLearnedWord() {
    if (!isLoggedIn()) {
        alert("请先登录账号，再搜索单词库。");
        return;
    }

    if (!cloudDataLoaded) {
        alert("正在加载云端学习记录，请稍后再搜索。");
        return;
    }

    var input = document.getElementById("globalWordSearchInput");
    var resultBox = document.getElementById("wordSearchResult");
    var resultSec = document.getElementById("searchResultSec");

    if (!input || !resultBox || !resultSec) return;

    var query = input.value.trim().toLowerCase();

    if (!query) {
        alert("请输入要搜索的单词。");
        return;
    }

    var history = cloudStudyData.history || {};
    var learnedDateMap = {};

    // 记录每个词在哪些日期学过
    Object.keys(history).forEach(function(date) {
        var dayData = history[date] || {};
        var words = dayData.words || [];

        words.forEach(function(w) {
            if (!w || !w.word) return;

            var key = String(w.word).toLowerCase();

            if (!learnedDateMap[key]) {
                learnedDateMap[key] = [];
            }

            if (learnedDateMap[key].indexOf(date) === -1) {
                learnedDateMap[key].push(date);
            }
        });
    });

    var resultMap = {};

    // 从完整单词库搜索，并按单词合并
    fullWordBank.forEach(function(w) {
        if (!w || !w.word) return;

        var wordText = String(w.word).toLowerCase();

        if (wordText.indexOf(query) !== -1) {
            if (!resultMap[wordText]) {
                resultMap[wordText] = {
                    word: w.word,
                    meanings: [],
                    examples: [],
                    topics: [],
                    dates: learnedDateMap[wordText] || [],
                    status: getWordStatusText(w.word)
                };
            }

            if (w.mean && resultMap[wordText].meanings.indexOf(w.mean) === -1) {
                resultMap[wordText].meanings.push(w.mean);
            }

            if (w.example && resultMap[wordText].examples.indexOf(w.example) === -1) {
                resultMap[wordText].examples.push(w.example);
            }

            if (w.topic && resultMap[wordText].topics.indexOf(w.topic) === -1) {
                resultMap[wordText].topics.push(w.topic);
            }
        }
    });

    var results = Object.keys(resultMap).map(function(key) {
        return resultMap[key];
    });

    showSearchResults(query, results);
}


   

function showSearchResults(query, results) {
    var modal = document.getElementById("searchModal");
    var subtitle = document.getElementById("searchModalSubtitle");
    var body = document.getElementById("searchModalBody");

    if (!modal || !subtitle || !body) return;

    subtitle.textContent = "搜索词：" + query;

    if (results.length === 0) {
        body.innerHTML =
            '<div class="search-empty-card">' +
            '词库中没有找到包含 “' + query + '” 的单词。' +
            '</div>';

        modal.style.display = "flex";
        return;
    }

    var html = "";

    results.forEach(function(item, idx) {
        var learnedInfo = "";

        if (item.dates && item.dates.length > 0) {
            learnedInfo = "学习日期：" + item.dates.sort().reverse().join("，");
        } else {
            learnedInfo = "学习状态：尚未学习";
        }

        var topicInfo = item.topics && item.topics.length > 0
            ? "词库分类：" + item.topics.join(" / ")
            : "词库分类：未分类";

        var meaningInfo = item.meanings && item.meanings.length > 0
            ? item.meanings.join("；")
            : "";

        var exampleHtml = "";

        if (item.examples && item.examples.length > 0) {
            item.examples.forEach(function(example, exampleIdx) {
                exampleHtml +=
                    '<div class="search-example-item">' +
                    '<span class="search-example-num">' + (exampleIdx + 1) + '.</span> ' +
                    example +
                    '</div>';
            });
        } else {
            exampleHtml = '<div class="search-example-item">暂无例句</div>';
        }

        html += ''
            + '<div class="search-result-card">'
            + '<div class="search-result-index">' + String(idx + 1).padStart(2, "0") + '</div>'
            + '<div class="search-result-word">' + item.word + '</div>'
            + '<div class="search-result-meaning">' + meaningInfo + '</div>'
            + '<div class="search-result-example-box">'
            + '<span class="word-card-example-label">Examples</span>'
            + exampleHtml
            + '</div>'
            + '<div class="search-meta-list">'
            + '<div class="search-meta-pill">' + learnedInfo + '</div>'
            + '<div class="search-meta-pill">当前状态：' + item.status + '</div>'
            + '<div class="search-meta-pill">' + topicInfo + '</div>'
            + '</div>'
            + '</div>';
    });

    body.innerHTML = html;
    modal.style.display = "flex";
}
function closeSearchModal() {
    var modal = document.getElementById("searchModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getTodayDisplay() {
    const d = new Date();
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const dateEl = document.getElementById("todayDate");
    if (dateEl) dateEl.innerText = getTodayDisplay();

    const nickname = localStorage.getItem("ielts_user_nickname");

    const welcomeEl = document.getElementById("welcomeText");
    const brandSubEl = document.getElementById("brandSubText");
    const loginBtn = document.getElementById("loginBtn");
    const userChip = document.getElementById("userChip");
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");

    if (nickname) {
        if (welcomeEl) welcomeEl.innerText = `${nickname} 你好，欢迎来到雅思学习平台`;
        if (brandSubEl) brandSubEl.innerText = `${nickname}'s Study Space`;

        if (loginBtn) loginBtn.style.display = "none";
        if (userChip) userChip.style.display = "flex";
        if (userAvatar) userAvatar.innerText = nickname.slice(0, 1).toUpperCase();
        if (userName) userName.innerText = nickname;
    } else {
        if (welcomeEl) welcomeEl.innerText = "欢迎登录，开启你的今日雅思学习";
        if (brandSubEl) brandSubEl.innerText = "Welcome to Study Space";

        if (loginBtn) loginBtn.style.display = "block";
        if (userChip) userChip.style.display = "none";
    }
    // 如果已经保存过 Token 和 Gist ID，页面打开后自动加载云端数据
    const token = localStorage.getItem("gh_token");
    const gistId = localStorage.getItem("gh_gist_id");

    if (token && gistId) {
    initCloudData(true);
    }
    document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeSearchModal();
    }
});

    

});





function autoStartTodayLearning() {
    if (!isLoggedIn()) {
        return;
    }

    if (!cloudDataLoaded) {
        return;
    }

    generateTodayContent();
}
function generateTodayContent() {
    if (!isLoggedIn()) {
        alert("请先登录账号，再开始今日学习。");
        return;
    }
    
    if (!cloudDataLoaded) {
    alert("正在加载云端学习记录，请稍后再开始学习。");
    return;
}

    document.getElementById("rev1").style.display = "block";
    document.getElementById("rev3").style.display = "block";
    document.getElementById("newWordSec").style.display = "block";
    document.getElementById("sentSec").style.display = "block";

    const today = getTodayStr();
    let todayNewWords;
    let isNewDay = (cloudStudyData.lastStudyDate !== today);

    if (isNewDay) {
        // 关键：先保存“进入今天之前”的复习内容快照
        const reviewD1Snapshot = cloudStudyData.d1ReviewWords || [];
        const reviewD3Snapshot = cloudStudyData.d3ReviewWords || [];

        cloudStudyData.todayReviewD1 = reviewD1Snapshot;
        cloudStudyData.todayReviewD3 = reviewD3Snapshot;

        const plan = typeof getStudyPlan === "function"
            ? getStudyPlan()
            : { newWordCount: 25, sentenceCount: 5 };

        // 生成今日新词
        todayNewWords = getUniqueNewWord(plan.newWordCount || 25);

        const wordNameList = todayNewWords.map(w => w.word);
        cloudStudyData.learnedWords = [
            ...new Set([...cloudStudyData.learnedWords, ...wordNameList])
        ];

        cloudStudyData.todayWords = todayNewWords;
        cloudStudyData.lastStudyDate = today;
        cloudStudyData.todaySentences = [];

        if (!cloudStudyData.history) cloudStudyData.history = {};
        if (!cloudStudyData.wordStatus) cloudStudyData.wordStatus = {};
        if (!cloudStudyData.weakWords) cloudStudyData.weakWords = [];
        cloudStudyData.history[today] = {
            words: todayNewWords,
            sentences: []
        };

        // 关键：这里更新的是“未来复习队列”
        // 今天页面不要直接显示这个更新后的 d1ReviewWords
        cloudStudyData.d3ReviewWords = reviewD1Snapshot;
        cloudStudyData.d1ReviewWords = todayNewWords.filter(function(w) {
    return !cloudStudyData.wordStatus || cloudStudyData.wordStatus[w.word] !== "familiar";
}).slice(0, 10);

        alert(`今天是 ${today}，已为你生成新一天的学习内容。`);
    } else {
        // 同一天再次点击：读取当天缓存，不重新生成
        todayNewWords = cloudStudyData.todayWords || [];

        // 兼容旧数据：如果今天已经生成过，但没有保存 today's review snapshot
        // 那今天的 D-1 / D-3 默认认为是空，避免把今天的新词误显示成昨日复盘
        if (!cloudStudyData.todayReviewD1) cloudStudyData.todayReviewD1 = [];
        if (!cloudStudyData.todayReviewD3) cloudStudyData.todayReviewD3 = [];

        if (!todayNewWords || todayNewWords.length === 0) {
            const plan = typeof getStudyPlan === "function"
                ? getStudyPlan()
                : { newWordCount: 25, sentenceCount: 5 };

            todayNewWords = getUniqueNewWord(plan.newWordCount || 25);
            cloudStudyData.todayWords = todayNewWords;

            const wordNameList = todayNewWords.map(w => w.word);
            cloudStudyData.learnedWords = [
                ...new Set([...cloudStudyData.learnedWords, ...wordNameList])
            ];

            if (!cloudStudyData.history) cloudStudyData.history = {};
            cloudStudyData.history[today] = {
                words: todayNewWords,
                sentences: []
            };
        }

        alert(`今天（${today}）已生成过内容，为你显示当天学习内容。`);
    }

    // 关键：页面显示的是“今天进入时的复习快照”
    renderReviewBlock(cloudStudyData.todayReviewD1 || [], "rev1List", "rev1Ans");
    renderReviewBlock(cloudStudyData.todayReviewD3 || [], "rev3List", "rev3Ans");

    renderNewWordList(todayNewWords);
    createQuiz(todayNewWords.slice(10, 15));
    const sentenceCount = getStudyPlan().sentenceCount || 5;
createLongSentenceBlock(isNewDay, sentenceCount);
}
window.generateTodayContent = generateTodayContent;


function renderReviewBlock(wordArr, listDom, ansDom) {
    wordArr = (wordArr || []).filter(function(item) {
    return !cloudStudyData.wordStatus || cloudStudyData.wordStatus[item.word] !== "familiar";
});
    let listHtml = "";
    let ansHtml = "";

    if (!wordArr || wordArr.length === 0) {
        document.getElementById(listDom).innerHTML =
            `<div class="word-item" style="color:#8b8f97;">暂无复习内容</div>`;
        document.getElementById(ansDom).innerHTML = "";
        return;
    }

    wordArr.forEach((item, idx) => {
        listHtml += `<div class="word-item">${idx + 1}. ${item.word}</div>`;
        ansHtml += `<div class="word-item">${idx + 1}. ${item.mean}</div>`;
    });

    document.getElementById(listDom).innerHTML = listHtml;
    document.getElementById(ansDom).innerHTML = "释义答案：<br>" + ansHtml;
}
function ensureWordStatusData() {
    if (!cloudStudyData.wordStatus) {
        cloudStudyData.wordStatus = {};
    }

    if (!cloudStudyData.weakWordRecords) {
        cloudStudyData.weakWordRecords = {};
    }
}

function ensureWeakDate(date) {
    ensureWordStatusData();

    if (!cloudStudyData.weakWordRecords[date]) {
        cloudStudyData.weakWordRecords[date] = {
            unfamiliar: [],
            fuzzy: []
        };
    }
}

function removeWordFromWeakRecords(word) {
    ensureWordStatusData();

    Object.keys(cloudStudyData.weakWordRecords).forEach(function(date) {
        cloudStudyData.weakWordRecords[date].unfamiliar =
            (cloudStudyData.weakWordRecords[date].unfamiliar || []).filter(function(item) {
                return item.word !== word;
            });

        cloudStudyData.weakWordRecords[date].fuzzy =
            (cloudStudyData.weakWordRecords[date].fuzzy || []).filter(function(item) {
                return item.word !== word;
            });
    });
}

function addWordToWeakRecords(wordObj, status) {
    var today = getTodayStr();

    ensureWeakDate(today);

    removeWordFromWeakRecords(wordObj.word);

    if (status === "unfamiliar") {
        cloudStudyData.weakWordRecords[today].unfamiliar.push(wordObj);
    }

    if (status === "fuzzy") {
        cloudStudyData.weakWordRecords[today].fuzzy.push(wordObj);
    }
}

function removeWordFromReviewQueues(word) {
    cloudStudyData.d1ReviewWords = (cloudStudyData.d1ReviewWords || []).filter(function(item) {
        return item.word !== word;
    });

    cloudStudyData.d3ReviewWords = (cloudStudyData.d3ReviewWords || []).filter(function(item) {
        return item.word !== word;
    });

    cloudStudyData.todayReviewD1 = (cloudStudyData.todayReviewD1 || []).filter(function(item) {
        return item.word !== word;
    });

    cloudStudyData.todayReviewD3 = (cloudStudyData.todayReviewD3 || []).filter(function(item) {
        return item.word !== word;
    });
}

function markWordStatus(wordObj, status) {
    ensureWordStatusData();

    cloudStudyData.wordStatus[wordObj.word] = status;

    if (status === "unfamiliar" || status === "fuzzy") {
        addWordToWeakRecords(wordObj, status);

        alert(
            "已标记为「" +
            (status === "unfamiliar" ? "陌生" : "模糊") +
            "」，已加入生词自查。记得点击【保存进度】同步云端。"
        );
    }

    if (status === "familiar") {
        removeWordFromWeakRecords(wordObj.word);
        removeWordFromReviewQueues(wordObj.word);

        alert("已标记为「熟悉」，未来将不再复习。记得点击【保存进度】同步云端。");
    }

    var weakSec = document.getElementById("weakWordsSec");
    if (weakSec && weakSec.style.display !== "none") {
        renderWeakWordsList();
    }
}

function markWeakWordAsFamiliar(word) {
    ensureWordStatusData();

    cloudStudyData.wordStatus[word] = "familiar";

    removeWordFromWeakRecords(word);
    removeWordFromReviewQueues(word);

    renderWeakWordsList();

    alert("已标记为「熟悉」，该单词已从生词自查中移除。记得点击【保存进度】同步云端。");
}

var currentWeakDate = "";

function renderWeakWordsList() {
    ensureWordStatusData();

    var dateButtonBox = document.getElementById("weakDateButtons");
    var container = document.getElementById("weakWordsList");

    if (!dateButtonBox || !container) return;

    var records = cloudStudyData.weakWordRecords || {};
    var dates = Object.keys(records).filter(function(date) {
        var record = records[date] || {};
        var unfamiliarList = record.unfamiliar || [];
        var fuzzyList = record.fuzzy || [];
        return unfamiliarList.length > 0 || fuzzyList.length > 0;
    }).sort().reverse();

    dateButtonBox.innerHTML = "";

    if (dates.length === 0) {
        container.innerHTML =
            '<div class="word-item" style="color:#8b8f97;">暂无生词。你可以在今日单词中将单词标记为「陌生」或「模糊」。</div>';
        return;
    }

    if (!currentWeakDate || dates.indexOf(currentWeakDate) === -1) {
        currentWeakDate = dates[0];
    }

    dates.forEach(function(date) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "weak-date-chip";

        if (date === currentWeakDate) {
            btn.className += " active";
        }

        var record = records[date] || {};
        var count =
            (record.unfamiliar || []).length +
            (record.fuzzy || []).length;

        btn.textContent = date + " · " + count + "词";

        btn.onclick = function() {
            currentWeakDate = date;
            renderWeakWordsList();
        };

        dateButtonBox.appendChild(btn);
    });

    renderWeakWordsByDate(currentWeakDate);
}
function renderWeakWordsByDate(date) {
    ensureWordStatusData();

    var container = document.getElementById("weakWordsList");
    if (!container) return;

    var records = cloudStudyData.weakWordRecords || {};
    var dayRecord = records[date];

    if (!dayRecord) {
        container.innerHTML =
            '<div class="word-item" style="color:#8b8f97;">该日期暂无生词。</div>';
        return;
    }

    var unfamiliarList = dayRecord.unfamiliar || [];
    var fuzzyList = dayRecord.fuzzy || [];

    var html = "";

    html += '<h3 class="weak-date-title">' + date + ' 生词</h3>';

    html += '<h4 class="weak-status-title">陌生</h4>';

    if (unfamiliarList.length > 0) {
        html += '<div class="word-card-grid">';

        unfamiliarList.forEach(function(w, idx) {
            html += buildWeakWordCard(w, idx, "陌生");
        });

        html += '</div>';
    } else {
        html += '<div class="word-item" style="color:#8b8f97;">暂无陌生单词。</div>';
    }

    html += '<h4 class="weak-status-title">模糊</h4>';

    if (fuzzyList.length > 0) {
        html += '<div class="word-card-grid">';

        fuzzyList.forEach(function(w, idx) {
            html += buildWeakWordCard(w, idx, "模糊");
        });

        html += '</div>';
    } else {
        html += '<div class="word-item" style="color:#8b8f97;">暂无模糊单词。</div>';
    }

    container.innerHTML = html;
}

function buildWeakWordCard(w, idx, statusText) {
    return ''
        + '<div class="word-card">'
        + '<div class="word-card-index">' + String(idx + 1).padStart(2, "0") + ' · ' + statusText + '</div>'
        + '<div class="word-card-word">' + w.word + '</div>'
        + '<div class="word-card-meaning">' + w.mean + '</div>'
        + '<div class="word-card-example">'
        + '<span class="word-card-example-label">Example</span>'
        + w.example
        + '</div>'
        + '<div class="word-status-actions">'
        + '<button class="status-btn status-familiar" onclick="markWeakWordAsFamiliar(\'' + w.word + '\')">我已掌握，移出</button>'
        + '</div>'
        + '</div>';
}

function markWeakWordAsFamiliar(word) {
    ensureWordStatusData();

    cloudStudyData.wordStatus[word] = "familiar";

    cloudStudyData.weakWords = cloudStudyData.weakWords.filter(function(item) {
        return item.word !== word;
    });

    renderWeakWordsList();

    alert("已标记为「熟悉」，该单词已从生词自查中移除。记得点击【保存进度】同步云端。");
}
function renderNewWordList(wordArr) {
    var container = document.getElementById("newWordList");
    container.innerHTML = "";

    var grid = document.createElement("div");
    grid.className = "word-card-grid";

    wordArr.forEach(function(w, idx) {
        var card = document.createElement("div");
        card.className = "word-card";

        var index = document.createElement("div");
        index.className = "word-card-index";
        index.textContent = String(idx + 1).padStart(2, "0");

        var word = document.createElement("div");
        word.className = "word-card-word";
        word.textContent = w.word;

        var meaning = document.createElement("div");
        meaning.className = "word-card-meaning";
        meaning.textContent = w.mean;

        var example = document.createElement("div");
        example.className = "word-card-example";

        var label = document.createElement("span");
        label.className = "word-card-example-label";
        label.textContent = "Example";

        var exampleText = document.createElement("div");
        exampleText.textContent = w.example;

        example.appendChild(label);
        example.appendChild(exampleText);

        var actions = document.createElement("div");
        actions.className = "word-status-actions";

        var unfamiliarBtn = document.createElement("button");
        unfamiliarBtn.type = "button";
        unfamiliarBtn.className = "status-btn status-unfamiliar";
        unfamiliarBtn.textContent = "陌生";
        unfamiliarBtn.onclick = function() {
            markWordStatus(w, "unfamiliar");
        };

        var fuzzyBtn = document.createElement("button");
        fuzzyBtn.type = "button";
        fuzzyBtn.className = "status-btn status-fuzzy";
        fuzzyBtn.textContent = "模糊";
        fuzzyBtn.onclick = function() {
            markWordStatus(w, "fuzzy");
        };

        var familiarBtn = document.createElement("button");
        familiarBtn.type = "button";
        familiarBtn.className = "status-btn status-familiar";
        familiarBtn.textContent = "熟悉";
        familiarBtn.onclick = function() {
            markWordStatus(w, "familiar");
        };

        actions.appendChild(unfamiliarBtn);
        actions.appendChild(fuzzyBtn);
        actions.appendChild(familiarBtn);

        card.appendChild(index);
        card.appendChild(word);
        card.appendChild(meaning);
        card.appendChild(example);
        card.appendChild(actions);

        grid.appendChild(card);
    });

    container.appendChild(grid);
}
function renderWeakWordsBySelectedDate() {
    ensureWordStatusData();

    var select = document.getElementById("weakDateSelect");
    var container = document.getElementById("weakWordsList");

    if (!select || !container) return;

    var selectedDate = select.value;

    if (!selectedDate) {
        container.innerHTML =
            '<div class="word-item" style="color:#8b8f97;">暂无生词。</div>';
        return;
    }

    var records = cloudStudyData.weakWordRecords || {};
    var dayRecord = records[selectedDate];

    if (!dayRecord) {
        container.innerHTML =
            '<div class="word-item" style="color:#8b8f97;">该日期暂无生词。</div>';
        return;
    }

    var unfamiliarList = dayRecord.unfamiliar || [];
    var fuzzyList = dayRecord.fuzzy || [];

    var html = "";

    html += '<h3 class="weak-date-title">' + selectedDate + ' 生词</h3>';

    html += '<h4 class="weak-status-title">陌生</h4>';

    if (unfamiliarList.length > 0) {
        html += '<div class="word-card-grid">';

        unfamiliarList.forEach(function(w, idx) {
            html += buildWeakWordCard(w, idx, "陌生");
        });

        html += '</div>';
    } else {
        html += '<div class="word-item" style="color:#8b8f97;">暂无陌生单词。</div>';
    }

    html += '<h4 class="weak-status-title">模糊</h4>';

    if (fuzzyList.length > 0) {
        html += '<div class="word-card-grid">';

        fuzzyList.forEach(function(w, idx) {
            html += buildWeakWordCard(w, idx, "模糊");
        });

        html += '</div>';
    } else {
        html += '<div class="word-item" style="color:#8b8f97;">暂无模糊单词。</div>';
    }

    container.innerHTML = html;
}
 
function createQuiz(wordArr) {
    const testTemplate = [
        "The new policy is ______ to cutting industrial pollution nationwide.",
        "Global nations finally reached a ______ on carbon emission limits.",
        "Manufacturers must ______ unnecessary fossil fuel consumption.",
        "Official documents ______ strict standards for factory waste discharge.",
        "The rapid ______ of renewable energy changes traditional industrial patterns."
    ];

    let quizHtml = "";

    window.globalQuizAns = wordArr.map(function(w) {
        return w.word;
    });

    wordArr.forEach(function(w, idx) {
        quizHtml += '<div class="test-block">' + (idx + 1) + '. ' + testTemplate[idx] + '</div>';
    });

    document.getElementById("quizArea").innerHTML = quizHtml;
}
let calendarViewDate = new Date();

// 打开历史日历
function showHistory() {
    
    if (!isLoggedIn()) {
        alert("请先登录账号，再查看学习日历。");
        return;
    }


    if (!cloudStudyData.history) cloudStudyData.history = {};
    if (!cloudStudyData.wordStatus) cloudStudyData.wordStatus = {};
    if (!cloudStudyData.weakWordRecords) cloudStudyData.weakWordRecords = {};
    if (!cloudStudyData.studyPlan) {
    cloudStudyData.studyPlan = {
        newWordCount: 25,
        sentenceCount: 5
    };
}
    
    document.getElementById("historySec").style.display = "block";
    document.getElementById("historySec").scrollIntoView({ behavior: "smooth" });

    calendarViewDate = new Date();
    renderHistoryCalendar();
}

// 关闭历史日历
function hideHistory() {
    document.getElementById("historySec").style.display = "none";
    document.getElementById("historyDetail").innerHTML = "";
}

// 切换月份
function changeCalendarMonth(offset) {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + offset);
    renderHistoryCalendar();
}

// 回到当前月份
function goCurrentMonth() {
    calendarViewDate = new Date();
    renderHistoryCalendar();
}

// 日期格式化：YYYY-MM-DD
function formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// 渲染日历
function renderHistoryCalendar() {
    const history = cloudStudyData.history || {};
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("calendarTitle");

    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    title.innerText = `${year}年${month + 1}月`;

    const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
    let html = "";

    weekdays.forEach(w => {
        html += `<div class="calendar-weekday">${w}</div>`;
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay();
    startOffset = startOffset === 0 ? 6 : startOffset - 1;

    const daysInMonth = lastDay.getDate();

    const todayRaw = new Date();
    const todayOnly = new Date(
        todayRaw.getFullYear(),
        todayRaw.getMonth(),
        todayRaw.getDate()
    );

    const todayKey = formatDateKey(todayOnly);

    // 上个月补位
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startOffset - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        html += `
        <div class="calendar-day future">
            <div class="calendar-date">${dayNum}</div>
            <div class="calendar-status">—</div>
        </div>`;
    }

    // 当前月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateKey = formatDateKey(dateObj);

        const hasStudy = !!history[dateKey];
        const isFuture = dateObj > todayOnly;
        const isToday = dateKey === todayKey;

        let cls = "calendar-day";
        let status = "";

        if (isFuture) {
            cls += " future";
            status = "未来";
        } else if (hasStudy) {
            cls += " studied";
            const wordCount = (history[dateKey].words || []).length;
            const sentCount = (history[dateKey].sentences || []).length;
            status = `${wordCount}词 · ${sentCount}句`;
        } else {
            cls += " missed";
            status = isToday ? "今天" : "未学习";
        }

        html += `
        <div class="${cls}" onclick="handleCalendarDayClick('${dateKey}')">
            <div class="calendar-date">${day}</div>
            <div class="calendar-status">${status}</div>
        </div>`;
    }

    // 下个月补位，补满 6 行
    const totalCells = startOffset + daysInMonth;
    const nextCells = 42 - totalCells;

    for (let i = 1; i <= nextCells; i++) {
        html += `
        <div class="calendar-day future">
            <div class="calendar-date">${i}</div>
            <div class="calendar-status">—</div>
        </div>`;
    }

    grid.innerHTML = html;
}

// 点击某一天
function handleCalendarDayClick(date) {
    const todayRaw = new Date();
    const todayOnly = new Date(
        todayRaw.getFullYear(),
        todayRaw.getMonth(),
        todayRaw.getDate()
    );

    const clickedDate = new Date(date);

    if (clickedDate > todayOnly) {
        return;
    }

    const dayData = (cloudStudyData.history || {})[date];

    if (!dayData) {
        document.getElementById("historyDetail").innerHTML = `
            <div class="long-sentence-card" style="background:#fff7f7;border-color:#fecaca;">
                <strong>📅 ${date}</strong><br><br>
                这一天没有学习记录。
            </div>
        `;
        document.getElementById("historyDetail").scrollIntoView({ behavior: "smooth" });
        return;
    }

    showHistoryDay(date);
}

// 显示某一天的具体学习内容
function showHistoryDay(date) {
    const dayData = (cloudStudyData.history || {})[date];

    if (!dayData) {
        document.getElementById("historyDetail").innerHTML = "<p>该日期无数据</p>";
        return;
    }

    let html = `<h3 style="color:#23395d;margin-top:24px;">📖 ${date} 学习内容</h3>`;

    html += `<h4 style="margin-top:16px;">🔤 当日学习的 ${(dayData.words || []).length} 个单词：</h4>`;

    (dayData.words || []).forEach((w, idx) => {
        html += `
        <div class="word-item">
            ${idx + 1}. <strong>${w.word}</strong> — ${w.mean}
            <div class="example-sentence">例句：${w.example}</div>
        </div>`;
    });

    html += `<h4 style="margin-top:20px;">📝 当日学习的 ${(dayData.sentences || []).length} 句长难句：</h4>`;

    (dayData.sentences || []).forEach((s, idx) => {
        html += `
        <div class="long-sentence-card">
            <strong>长难句 ${idx + 1}（话题：${s.topic}）</strong><br><br>
            <strong>原句：</strong>${s.sentence}<br><br>
            <strong>核心句式：</strong>${s.structure}<br>
            <strong>中文翻译：</strong>${s.translation}<br>
            <strong>仿写模板：</strong>${s.template}
        </div>`;
    });

    document.getElementById("historyDetail").innerHTML = html;
    document.getElementById("historyDetail").scrollIntoView({ behavior: "smooth" });
}
function showQuizAnswer() {
    let ansText = "";
    window.globalQuizAns.forEach((ans, idx) => ansText += `${idx+1}. ${ans}<br>`);
    document.getElementById("quizAns").style.display = "block";
    document.getElementById("quizAns").innerHTML = "自测答案：<br>" + ansText;
}

function createLongSentenceBlock(isNewDay, sentenceCount) {
    sentenceCount = sentenceCount || 5;
    if (!cloudStudyData.learnedSentences) cloudStudyData.learnedSentences = [];
    if (!cloudStudyData.todaySentences) cloudStudyData.todaySentences = [];


    let todaySentences;

    if (isNewDay || cloudStudyData.todaySentences.length === 0) {
        const unused = fullSentenceBank.filter(s => !cloudStudyData.learnedSentences.includes(s.id));
       
const pool = unused.length >= sentenceCount
    ? unused
    : fullSentenceBank;

        todaySentences = pool.sort(() => Math.random() - 0.5).slice(0, sentenceCount);
        const todayIds = todaySentences.map(s => s.id);
        cloudStudyData.learnedSentences = [...new Set([...cloudStudyData.learnedSentences, ...todayIds])];
        cloudStudyData.todaySentences = todaySentences;
        // 也存到今天的历史记录里
        const today = getTodayStr();
        if (!cloudStudyData.history) cloudStudyData.history = {};
        if (!cloudStudyData.history[today]) cloudStudyData.history[today] = { words: [], sentences: [] };
        cloudStudyData.history[today].sentences = todaySentences;
    } else {
        todaySentences = cloudStudyData.todaySentences;
    }

    let sentHtml = "";
    todaySentences.forEach((s, idx) => {
        sentHtml += `
        <div class="long-sentence-card">
            <strong>长难句 ${idx+1}（话题：${s.topic}）</strong><br><br>
            <strong>原句：</strong>${s.sentence}<br><br>
            <strong>核心句式：</strong>${s.structure}<br>
            <strong>中文翻译：</strong>${s.translation}<br>
            <strong>仿写模板：</strong>${s.template}
        </div>`;
    });
    document.getElementById("sentArea").innerHTML = sentHtml;
}
