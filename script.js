

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


// 雅思长难句库（40句，覆盖6大高频话题）
const fullSentenceBank = [
{
  id: "S001", topic: "environment",
  sentence: "Despite the widespread adoption of renewable energy sources, fossil fuels continue to dominate the global energy mix, largely because the infrastructure required to support a full transition remains prohibitively expensive.",
  structure: "让步状语(Despite...) + 主句 + 原因状语从句(because...) + 主语从句(the infrastructure...)",
  translation: "尽管可再生能源已被广泛采用，化石燃料仍主导全球能源结构，主要因为支撑全面转型所需的基础设施依然价格高昂。",
  template: "Despite the widespread adoption of ______, ______ continue to dominate ______, largely because ______."
},
{
  id: "S002", topic: "environment",
  sentence: "Scientists warn that unless governments take immediate action to curb greenhouse gas emissions, the consequences of climate change will become irreversible within the next few decades.",
  structure: "宾语从句(that...) + 条件状语从句(unless...) + 主句",
  translation: "科学家警告，除非各国政府立即采取措施遏制温室气体排放，否则未来几十年内气候变化的后果将不可逆转。",
  template: "Experts warn that unless ______ take action to ______, ______ will become ______."
},
{
  id: "S003", topic: "environment",
  sentence: "The rapid depletion of natural resources, coupled with the accelerating loss of biodiversity, poses a threat that no single country can address on its own.",
  structure: "主语 + 伴随状语(coupled with...) + 谓语 + 定语从句(that...)",
  translation: "自然资源的快速枯竭，加上生物多样性的加速丧失，构成了一种任何国家都无法独立应对的威胁。",
  template: "The rapid ______ of ______, coupled with ______, poses a threat that ______."
},
{
  id: "S004", topic: "environment",
  sentence: "While economic growth has lifted millions out of poverty, it has also left behind an environmental footprint so vast that reversing it may take generations.",
  structure: "让步状语从句(While...) + 主句 + 结果状语从句(so...that...)",
  translation: "虽然经济增长使数百万人摆脱了贫困，但也留下了极其庞大的生态足迹，逆转它可能需要数代人。",
  template: "While ______ has brought ______, it has also left behind ______ so vast that ______."
},
{
  id: "S005", topic: "environment",
  sentence: "Plastic waste, which accumulates in marine ecosystems at an alarming rate, has been identified as one of the most pressing environmental challenges of the 21st century.",
  structure: "主语 + 非限制性定语从句(which...) + 被动语态谓语 + 表语",
  translation: "塑料垃圾以惊人的速度在海洋生态系统中积累，已被认定为21世纪最紧迫的环境挑战之一。",
  template: "______, which ______ at an alarming rate, has been identified as one of the most ______."
},
{
  id: "S006", topic: "education",
  sentence: "It is widely acknowledged that access to quality education plays a decisive role in reducing social inequality, yet millions of children in developing regions still lack basic learning resources.",
  structure: "形式主语it + 主语从句(that...) + 转折连词(yet) + 并列句",
  translation: "人们普遍认为，接受优质教育的机会对减少社会不平等起决定性作用，但发展中地区仍有数百万儿童缺乏基本学习资源。",
  template: "It is widely acknowledged that ______ plays a decisive role in ______, yet ______ still lack ______."
},
{
  id: "S007", topic: "education",
  sentence: "Universities that fail to adapt their curricula to the demands of a rapidly evolving job market risk producing graduates whose skills are already outdated upon entering the workforce.",
  structure: "主语 + 定语从句(that fail...) + 谓语 + 宾语 + 定语从句(whose...)",
  translation: "未能根据快速变化的就业市场需求调整课程的大学，可能培养出一批进入职场时技能就已经过时的毕业生。",
  template: "Institutions that fail to adapt to ______ risk producing ______ whose ______ are already outdated."
},
{
  id: "S008", topic: "education",
  sentence: "The extent to which online learning can replace traditional classroom instruction remains a subject of considerable debate among educators worldwide.",
  structure: "主语(The extent) + 定语从句(to which...) + 谓语 + 表语 + 后置定语",
  translation: "在线学习能在多大程度上取代传统课堂教学，仍是全球教育者之间颇具争议的话题。",
  template: "The extent to which ______ can replace ______ remains a subject of considerable debate among ______."
},
{
  id: "S009", topic: "education",
  sentence: "Encouraging students to think critically, rather than merely memorize facts, is essential if schools are to prepare young people for the complex challenges of modern society.",
  structure: "动名词主语 + 插入语(rather than...) + 谓语 + 条件状语从句(if...)",
  translation: "鼓励学生批判性思考，而非仅仅死记硬背，是学校为年轻人应对现代社会复杂挑战做准备的关键。",
  template: "Encouraging ______ to ______, rather than merely ______, is essential if ______ are to ______."
},
{
  id: "S010", topic: "education",
  sentence: "Studies have shown that early childhood education, when properly designed, can yield lifelong benefits that far outweigh the initial financial investment.",
  structure: "宾语从句(that...) + 插入语(when...) + 定语从句(that far outweigh...)",
  translation: "研究表明，设计得当的幼儿教育能带来终生的收益，远超最初的资金投入。",
  template: "Studies have shown that ______, when properly designed, can yield ______ that far outweigh ______."
},
{
  id: "S011", topic: "technology",
  sentence: "Artificial intelligence, once considered a distant possibility, has become deeply integrated into everyday life in ways that few could have predicted a decade ago.",
  structure: "主语 + 过去分词插入语(once considered...) + 谓语 + 方式状语 + 定语从句(that...)",
  translation: "人工智能曾被视为遥远的可能性，如今已深度融入日常生活，其方式是十年前少有人能预见的。",
  template: "______, once considered ______, has become deeply integrated into ______ in ways that ______."
},
{
  id: "S012", topic: "technology",
  sentence: "As technology continues to reshape the way we communicate, work and learn, concerns have been raised about the potential erosion of face-to-face human interaction.",
  structure: "时间状语从句(As...) + 主句(被动语态) + 介词短语(about...)",
  translation: "随着科技持续重塑我们沟通、工作和学习的方式，人们担忧面对面的人际互动可能被侵蚀。",
  template: "As ______ continues to reshape ______, concerns have been raised about ______."
},
{
  id: "S013", topic: "technology",
  sentence: "The rise of automation, while boosting productivity in numerous industries, has simultaneously eliminated countless jobs that once provided stable incomes for working-class families.",
  structure: "主语 + 让步状语(while...) + 谓语 + 宾语 + 定语从句(that...)",
  translation: "自动化的兴起虽然提升了众多行业的生产力，但也同时消灭了大量曾为工薪家庭提供稳定收入的工作岗位。",
  template: "The rise of ______, while boosting ______, has simultaneously eliminated ______ that once ______."
},
{
  id: "S014", topic: "technology",
  sentence: "Governments around the world are struggling to formulate regulations that keep pace with the rapid development of digital technologies without stifling innovation.",
  structure: "主语 + 谓语(不定式) + 定语从句(that...) + 介词短语(without...)",
  translation: "各国政府正努力制定既能跟上数字技术快速发展、又不扼杀创新的法规。",
  template: "Governments are struggling to formulate ______ that keep pace with ______ without ______."
},
{
  id: "S015", topic: "technology",
  sentence: "It has become increasingly clear that the benefits of technological advancement cannot be fully realized unless issues of data privacy and cybersecurity are effectively addressed.",
  structure: "形式主语it + 主语从句 + 条件状语从句(unless...)",
  translation: "越来越清楚的是，除非数据隐私和网络安全问题得到有效解决，否则技术进步的益处无法完全实现。",
  template: "It has become clear that the benefits of ______ cannot be fully realized unless ______ are effectively addressed."
},
{
  id: "S016", topic: "society",
  sentence: "In an era where information spreads faster than ever before, the ability to distinguish credible sources from misinformation has become an essential life skill.",
  structure: "时间状语(In an era) + 定语从句(where...) + 主语 + 谓语 + 表语",
  translation: "在信息传播速度前所未有的时代，辨别可信来源与虚假信息的能力已成为一项基本生活技能。",
  template: "In an era where ______ spreads faster than ever, the ability to ______ has become an essential ______."
},
{
  id: "S017", topic: "society",
  sentence: "The widening gap between the rich and the poor, if left unaddressed, could undermine social cohesion and trigger unrest in even the most stable democracies.",
  structure: "主语 + 条件状语(if left...) + 并列谓语 + 让步状语(in even...)",
  translation: "贫富差距若不加以解决，可能会侵蚀社会凝聚力，甚至在最稳定的民主国家引发动荡。",
  template: "The widening gap between ______ and ______, if left unaddressed, could undermine ______ and trigger ______."
},
{
  id: "S018", topic: "society",
  sentence: "Urbanization, driven by the promise of better economic opportunities, has led to the rapid growth of megacities but also to a range of social problems that policymakers struggle to solve.",
  structure: "主语 + 过去分词短语(driven by...) + 并列谓语 + 定语从句(that...)",
  translation: "在更好经济机会的驱动下，城市化推动了特大城市的快速发展，但也带来了一系列决策者难以解决的社会问题。",
  template: "______, driven by the promise of ______, has led to ______ but also to ______ that policymakers struggle to solve."
},
{
  id: "S019", topic: "society",
  sentence: "Volunteers who devote their time to community service not only strengthen the social fabric but also gain a profound sense of personal fulfillment that money cannot buy.",
  structure: "主语 + 定语从句(who...) + not only...but also 并列结构 + 定语从句(that...)",
  translation: "投身社区服务的志愿者不仅巩固了社会结构，也获得了金钱无法买到的深切个人成就感。",
  template: "People who devote their time to ______ not only strengthen ______ but also gain ______ that ______."
},
{
  id: "S020", topic: "society",
  sentence: "The debate over whether governments should prioritize individual freedom or collective welfare has persisted for centuries and shows no sign of being resolved anytime soon.",
  structure: "主语(The debate) + 介词短语(over whether...) + 并列谓语",
  translation: "关于政府应优先保障个人自由还是集体福祉的争论已持续数世纪，短期内看不到解决的迹象。",
  template: "The debate over whether ______ should prioritize ______ or ______ has persisted for ______."
},
{
  id: "S021", topic: "economy",
  sentence: "Small and medium-sized enterprises, which contribute significantly to employment and innovation, often struggle to access the financial resources they need to expand.",
  structure: "主语 + 非限制性定语从句(which...) + 谓语 + 定语从句(they need...)",
  translation: "对就业和创新贡献巨大的中小企业，往往难以获得扩张所需的资金资源。",
  template: "______, which contribute significantly to ______, often struggle to access ______ they need to ______."
},
{
  id: "S022", topic: "economy",
  sentence: "Countries that rely heavily on the export of a single commodity are particularly vulnerable to global price fluctuations that can devastate their economies overnight.",
  structure: "主语 + 定语从句(that rely...) + 谓语 + 表语 + 定语从句(that can devastate...)",
  translation: "严重依赖单一商品出口的国家，尤其容易受到全球价格波动的冲击，这种波动可以在一夜之间摧毁其经济。",
  template: "Countries that rely heavily on ______ are particularly vulnerable to ______ that can devastate ______."
},
{
  id: "S023", topic: "economy",
  sentence: "Although globalization has created unprecedented opportunities for trade and cultural exchange, it has also intensified competition to a level that many domestic industries find difficult to withstand.",
  structure: "让步状语从句(Although...) + 主句 + 结果状语(to a level that...)",
  translation: "尽管全球化为贸易和文化交流创造了前所未有的机会，也将竞争加剧到许多国内产业难以承受的程度。",
  template: "Although ______ has created opportunities for ______, it has also intensified ______ to a level that ______."
},
{
  id: "S024", topic: "economy",
  sentence: "The government's decision to invest heavily in infrastructure, though controversial at the time, ultimately proved to be a catalyst for decades of sustained economic growth.",
  structure: "主语 + 同位语从句(to invest...) + 插入语(though...) + 谓语",
  translation: "政府大举投资基础设施的决定，当时虽有争议，但最终被证明是数十年持续经济增长的催化剂。",
  template: "The decision to invest heavily in ______, though controversial at the time, ultimately proved to be a catalyst for ______."
},
{
  id: "S025", topic: "economy",
  sentence: "Consumers today are increasingly willing to pay a premium for products that are produced sustainably, a trend that reflects growing environmental awareness across generations.",
  structure: "主语 + 谓语 + 定语从句(that are produced...) + 同位语(a trend...) + 定语从句(that reflects...)",
  translation: "如今的消费者越来越愿意为可持续生产的产品支付溢价，这一趋势反映了跨代际不断增强的环保意识。",
  template: "Consumers today are increasingly willing to pay a premium for ______, a trend that reflects ______."
},
{
  id: "S026", topic: "health",
  sentence: "Regular physical activity, combined with a balanced diet, has been shown to significantly reduce the risk of chronic diseases such as diabetes and heart failure.",
  structure: "主语 + 过去分词伴随状语(combined with...) + 被动语态谓语 + 不定式",
  translation: "规律的体育锻炼加上均衡饮食，已被证明能显著降低糖尿病和心力衰竭等慢性病的风险。",
  template: "______, combined with ______, has been shown to significantly reduce the risk of ______ such as ______."
},
{
  id: "S027", topic: "health",
  sentence: "Mental health issues, which were once regarded as personal weakness, are now widely recognized as legitimate medical conditions requiring professional treatment.",
  structure: "主语 + 非限制性定语从句(which...) + 谓语 + 现在分词短语(requiring...)",
  translation: "曾被视为个人软弱的心理健康问题，如今已被广泛认可为需要专业治疗的合法医学状况。",
  template: "______, which were once regarded as ______, are now widely recognized as ______ requiring ______."
},
{
  id: "S028", topic: "health",
  sentence: "In many developing countries, limited access to clean water and basic medical care remains a major obstacle to improving overall public health outcomes.",
  structure: "地点状语(In...) + 主语 + 谓语 + 表语 + 不定式后置定语",
  translation: "在许多发展中国家，清洁水和基础医疗的获取受限，仍是改善整体公共健康成果的主要障碍。",
  template: "In many ______, limited access to ______ remains a major obstacle to improving ______."
},
{
  id: "S029", topic: "health",
  sentence: "The rising prevalence of obesity among children is a public health concern that demands coordinated action from schools, parents and government agencies alike.",
  structure: "主语 + 表语 + 定语从句(that demands...) + 后置状语",
  translation: "儿童肥胖率上升是一项公共健康问题，需要学校、家长和政府机构共同采取协调行动。",
  template: "The rising prevalence of ______ is a ______ concern that demands coordinated action from ______."
},
{
  id: "S030", topic: "health",
  sentence: "It is often argued that governments should impose higher taxes on unhealthy foods to discourage consumption and offset the medical costs associated with diet-related illnesses.",
  structure: "形式主语it + 主语从句 + 不定式目的状语 + 定语从句(associated with...)",
  translation: "人们常认为政府应对不健康食品征收更高的税，以抑制消费并抵消与饮食相关疾病的医疗成本。",
  template: "It is often argued that ______ should impose higher taxes on ______ to discourage ______ and offset ______."
},
{
  id: "S031", topic: "environment",
  sentence: "Deforestation not only destroys the habitats of countless species but also releases vast amounts of stored carbon into the atmosphere, accelerating climate change.",
  structure: "not only...but also 并列谓语 + 现在分词状语(accelerating...)",
  translation: "森林砍伐不仅摧毁了无数物种的栖息地，还将大量储存的碳释放到大气中，加速了气候变化。",
  template: "______ not only destroys ______ but also releases ______, accelerating ______."
},
{
  id: "S032", topic: "education",
  sentence: "Bilingual education, far from being a mere academic advantage, equips students with cognitive flexibility that proves invaluable in an increasingly interconnected world.",
  structure: "主语 + 插入语(far from being...) + 谓语 + 定语从句(that proves...)",
  translation: "双语教育远不止是学术优势，它赋予学生认知灵活性，在日益互联的世界中价值无可估量。",
  template: "______, far from being a mere ______, equips ______ with ______ that proves invaluable in ______."
},
{
  id: "S033", topic: "technology",
  sentence: "Social media platforms, despite offering unprecedented connectivity, have been criticized for amplifying divisive content and eroding users' attention spans.",
  structure: "主语 + 让步状语(despite offering...) + 被动谓语 + 并列现在分词",
  translation: "社交媒体平台尽管提供了前所未有的连接性，却因放大分裂性内容和侵蚀用户注意力而受到批评。",
  template: "______, despite offering ______, have been criticized for ______ and eroding ______."
},
{
  id: "S034", topic: "society",
  sentence: "The traditional notion that success is measured solely by wealth and status is gradually giving way to a broader definition that includes personal well-being and social contribution.",
  structure: "主语 + 同位语从句(that...) + 谓语 + 定语从句(that includes...)",
  translation: "认为成功仅以财富和地位衡量的传统观念，正逐渐让位于包含个人幸福感和社会贡献的更宽泛定义。",
  template: "The traditional notion that ______ is gradually giving way to a broader definition that includes ______."
},
{
  id: "S035", topic: "economy",
  sentence: "Youth unemployment, if not addressed through targeted policy intervention, has the potential to breed long-term social discontent and economic stagnation.",
  structure: "主语 + 条件状语(if not addressed...) + 谓语 + 不定式宾语",
  translation: "青年失业若不通过有针对性的政策干预加以解决，就可能滋生长期的社会不满和经济停滞。",
  template: "______, if not addressed through ______, has the potential to breed ______ and ______."
},
{
  id: "S036", topic: "health",
  sentence: "Advances in medical technology have extended average life expectancy considerably, yet they have also raised difficult ethical questions about end-of-life care and resource allocation.",
  structure: "主语 + 谓语 + 转折连词(yet) + 并列句 + 介词短语(about...)",
  translation: "医疗技术的进步大幅延长了平均预期寿命，但也提出了关于临终关怀和资源分配的棘手伦理问题。",
  template: "Advances in ______ have ______, yet they have also raised difficult questions about ______."
},
{
  id: "S037", topic: "environment",
  sentence: "Wildlife conservation efforts, though often hampered by insufficient funding, have nonetheless achieved remarkable success in bringing several endangered species back from the brink of extinction.",
  structure: "主语 + 让步状语(though hampered...) + 谓语 + 现在分词状语(in bringing...)",
  translation: "野生动物保护工作虽经常受资金不足所困，但仍取得了显著成效，将若干濒危物种从灭绝边缘挽救回来。",
  template: "______, though often hampered by ______, have nonetheless achieved remarkable success in ______."
},
{
  id: "S038", topic: "education",
  sentence: "Standardized testing, while providing a convenient means of comparing student performance, may fail to capture the creativity and critical thinking that employers increasingly value.",
  structure: "主语 + 让步状语(while providing...) + 谓语 + 宾语 + 定语从句(that employers...)",
  translation: "标准化考试虽然提供了比较学生表现的便捷方式，但可能无法衡量雇主日益看重的创造力和批判性思维。",
  template: "______, while providing a convenient means of ______, may fail to capture ______ that ______ increasingly value."
},
{
  id: "S039", topic: "technology",
  sentence: "The extent to which artificial intelligence will transform the labor market depends not only on the pace of technological development but also on how societies choose to distribute the resulting economic benefits.",
  structure: "主语从句 + 谓语 + not only...but also 并列宾语",
  translation: "人工智能对劳动力市场的改变程度，不仅取决于技术发展速度，还取决于社会如何分配由此产生的经济收益。",
  template: "The extent to which ______ will transform ______ depends not only on ______ but also on how ______."
},
{
  id: "S040", topic: "society",
  sentence: "Efforts to promote gender equality in the workplace have yielded significant progress over recent decades, though structural barriers continue to prevent women from reaching top leadership positions in many industries.",
  structure: "主语 + 不定式后置定语 + 谓语 + 让步状语从句(though...)",
  translation: "近几十年来，推动职场性别平等的努力取得了显著进展，但结构性障碍仍阻碍女性在许多行业进入高层领导岗位。",
  template: "Efforts to promote ______ have yielded significant progress, though ______ continue to prevent ______ from ______."
}
    ,
{
  id: "S041", topic: "environment",
  sentence: "The transition to a circular economy, in which waste materials are continuously reused rather than discarded, represents one of the most promising strategies for reducing humanity's ecological footprint.",
  structure: "主语 + 非限制性定语从句(in which...) + 谓语 + 表语",
  translation: "向循环经济的转型——即废弃材料被持续再利用而非丢弃——是减少人类生态足迹最有希望的策略之一。",
  template: "The transition to ______, in which ______ are continuously ______ rather than ______, represents one of the most promising strategies for ______."
},
{
  id: "S042", topic: "environment",
  sentence: "Rising sea levels, caused primarily by melting polar ice caps, threaten to submerge coastal cities that are home to hundreds of millions of people worldwide.",
  structure: "主语 + 过去分词短语(caused by...) + 谓语 + 不定式 + 定语从句(that...)",
  translation: "主要由极地冰盖融化导致的海平面上升，将威胁淹没全球数亿人居住的沿海城市。",
  template: "______, caused primarily by ______, threaten to ______ that are home to ______."
},
{
  id: "S043", topic: "environment",
  sentence: "Renewable energy sources such as wind and solar power have become increasingly cost-competitive with fossil fuels, a development that could reshape the global energy landscape within a generation.",
  structure: "主语 + 谓语 + 同位语(a development...) + 定语从句(that could...)",
  translation: "风能和太阳能等可再生能源在成本上已日益能与化石燃料竞争，这一进展可能在一代人时间内重塑全球能源格局。",
  template: "______ such as ______ have become increasingly ______, a development that could reshape ______ within ______."
},
{
  id: "S044", topic: "environment",
  sentence: "Efforts to combat air pollution in major cities have yielded mixed results, with some regions seeing dramatic improvements while others continue to suffer from hazardous levels of smog.",
  structure: "主语 + 谓语 + 独立主格结构(with...) + 让步状语从句(while...)",
  translation: "大城市治理空气污染的努力效果参差不齐——部分地区显著改善，另一些地区仍持续遭受危险级别的雾霾。",
  template: "Efforts to combat ______ have yielded mixed results, with some ______ seeing ______ while others continue to suffer from ______."
},
{
  id: "S045", topic: "environment",
  sentence: "Environmental regulations, when strictly enforced, can drive industries toward cleaner production methods without necessarily compromising economic competitiveness.",
  structure: "主语 + 插入语(when...) + 谓语 + 状语(without...)",
  translation: "严格执行的环保法规能够推动产业采用更清洁的生产方式，同时未必损害经济竞争力。",
  template: "______, when strictly enforced, can drive ______ toward ______ without necessarily ______."
},
{
  id: "S046", topic: "environment",
  sentence: "The loss of biodiversity, often overlooked in favor of more visible environmental issues, may ultimately prove to be one of the most catastrophic consequences of human activity.",
  structure: "主语 + 过去分词短语(often overlooked...) + 谓语 + 表语",
  translation: "生物多样性的丧失常因让位于更显眼的环境问题而被忽视，但它最终可能被证明是人类活动最灾难性的后果之一。",
  template: "______, often overlooked in favor of ______, may ultimately prove to be one of the most ______."
},
{
  id: "S047", topic: "environment",
  sentence: "Only when individuals, corporations and governments work together in a coordinated manner can meaningful progress be made in addressing the climate crisis.",
  structure: "Only when 倒装句 + 部分倒装主句",
  translation: "只有当个人、企业和政府协调一致地共同行动，应对气候危机才能取得实质性进展。",
  template: "Only when ______, ______ and ______ work together in a coordinated manner can ______ be made in ______."
},
{
  id: "S048", topic: "education",
  sentence: "The growing emphasis on standardized test scores has led many educators to worry that schools are producing students who can pass exams but struggle to think independently.",
  structure: "主语 + 谓语 + 宾语从句(that...) + 定语从句(who...)",
  translation: "对标准化考试分数日益增长的重视让许多教育者担忧：学校培养出的学生能通过考试，却难以独立思考。",
  template: "The growing emphasis on ______ has led many ______ to worry that ______ are producing ______ who can ______ but struggle to ______."
},
{
  id: "S049", topic: "education",
  sentence: "Learning a second language at an early age, according to numerous studies, enhances not only communication skills but also cognitive development in ways that persist throughout adulthood.",
  structure: "主语 + 插入语(according to...) + 谓语 + not only...but also 并列宾语 + 定语从句(that...)",
  translation: "众多研究表明，幼年学习第二语言不仅能提升沟通能力，还能促进认知发展，且这种影响将持续到成年。",
  template: "______ at an early age, according to numerous studies, enhances not only ______ but also ______ in ways that persist ______."
},
{
  id: "S050", topic: "education",
  sentence: "It would be naive to assume that simply providing access to technology will transform education, since without proper training teachers cannot fully harness its potential.",
  structure: "形式主语it + 主语从句 + 原因状语从句(since...) + 条件状语(without...)",
  translation: "认为仅提供技术就能改变教育是天真的想法，因为没有恰当培训，教师无法充分发挥其潜力。",
  template: "It would be naive to assume that simply ______ will transform ______, since without ______ ______ cannot fully harness ______."
},
{
  id: "S051", topic: "education",
  sentence: "Vocational training programs, long dismissed as inferior to university degrees, are gaining renewed respect as economies increasingly demand practical, hands-on skills.",
  structure: "主语 + 过去分词短语(long dismissed as...) + 谓语 + 原因状语从句(as...)",
  translation: "长期被视为不如大学学位的职业培训项目，正随着经济对实用动手能力需求的增加重新赢得尊重。",
  template: "______, long dismissed as inferior to ______, are gaining renewed respect as ______ increasingly demand ______."
},
{
  id: "S052", topic: "education",
  sentence: "Higher education institutions must balance the pursuit of academic excellence with the responsibility of ensuring that talented students from disadvantaged backgrounds are not excluded.",
  structure: "主语 + 谓语 + balance A with B + 同位语从句(that...)",
  translation: "高等教育机构必须在追求学术卓越与确保来自弱势背景的优秀学生不被排斥之间取得平衡。",
  template: "______ must balance the pursuit of ______ with the responsibility of ensuring that ______ from ______ are not ______."
},
{
  id: "S053", topic: "education",
  sentence: "Homework, when assigned in reasonable amounts, reinforces classroom learning; however, excessive workloads can lead to burnout and diminished academic performance.",
  structure: "主语 + 插入语(when...) + 谓语 + 分号连接的对比句(however...)",
  translation: "适量布置的家庭作业能巩固课堂学习；然而过量的作业负担会导致倦怠和学业表现下滑。",
  template: "______, when ______ in reasonable amounts, ______; however, excessive ______ can lead to ______ and ______."
},
{
  id: "S054", topic: "education",
  sentence: "The idea that intelligence is fixed at birth has been thoroughly discredited by modern research showing that the brain remains capable of significant growth well into adulthood.",
  structure: "主语 + 同位语从句(that...) + 被动谓语 + 现在分词短语(showing...) + 宾语从句(that...)",
  translation: "认为智力与生俱来且固定不变的观点已被现代研究彻底推翻，研究表明大脑直到成年后仍具有显著的成长能力。",
  template: "The idea that ______ has been thoroughly discredited by ______ showing that ______ remains capable of ______."
},
{
  id: "S055", topic: "technology",
  sentence: "As algorithms increasingly influence decisions ranging from job recruitment to criminal sentencing, calls for greater transparency and accountability have grown louder.",
  structure: "时间状语从句(As...) + 现在分词短语(ranging from...to...) + 主句",
  translation: "随着算法越来越多地影响从招聘到刑事判决的各类决策，要求提高透明度和问责制的呼声日益高涨。",
  template: "As ______ increasingly influence decisions ranging from ______ to ______, calls for greater ______ have grown louder."
},
{
  id: "S056", topic: "technology",
  sentence: "Renewable energy technologies have advanced at a pace few experts predicted, driving down costs and making clean electricity accessible to communities that once relied on polluting fuels.",
  structure: "主语 + 谓语 + 定语从句(few experts predicted) + 现在分词状语(driving...) + 定语从句(that once...)",
  translation: "可再生能源技术的进步速度超出多数专家预期，成本随之下降，使曾依赖污染性燃料的社区也能用上清洁电力。",
  template: "______ have advanced at a pace few experts predicted, driving down ______ and making ______ accessible to ______ that once ______."
},
{
  id: "S057", topic: "technology",
  sentence: "The convenience offered by smartphones comes at a cost that few users fully appreciate: their personal data is constantly harvested and sold to advertisers.",
  structure: "主语 + 过去分词短语(offered by...) + 谓语 + 定语从句(that few...) + 冒号解释",
  translation: "智能手机带来的便利有着少有用户充分意识到的代价——他们的个人数据被持续收集并出售给广告商。",
  template: "The convenience offered by ______ comes at a cost that few ______ fully appreciate: ______ is constantly ______ and sold to ______."
},
{
  id: "S058", topic: "technology",
  sentence: "Not until researchers develop effective safeguards against algorithmic bias can artificial intelligence be deployed responsibly in high-stakes fields such as healthcare and law.",
  structure: "Not until 部分倒装 + 主句 + 举例状语(such as...)",
  translation: "只有当研究人员开发出针对算法偏见的有效防护措施，人工智能才能负责任地部署于医疗、司法等高风险领域。",
  template: "Not until ______ develop effective safeguards against ______ can ______ be deployed responsibly in ______ such as ______."
},
{
  id: "S059", topic: "technology",
  sentence: "The digital divide between those with reliable internet access and those without has widened during the pandemic, exposing deep inequalities that policymakers can no longer afford to ignore.",
  structure: "主语 + 介词短语(between...and...) + 谓语 + 现在分词状语(exposing...) + 定语从句(that...)",
  translation: "疫情期间，网络接入有无之间的数字鸿沟进一步扩大，暴露出决策者再也无法忽视的深层不平等。",
  template: "The ______ between those with ______ and those without has widened during ______, exposing ______ that ______ can no longer afford to ignore."
},
{
  id: "S060", topic: "technology",
  sentence: "While no one denies the transformative potential of biotechnology, ethical concerns about gene editing continue to shape the pace and direction of scientific progress.",
  structure: "让步状语从句(While...) + 主句 + 定语关系(about gene editing)",
  translation: "尽管无人否认生物技术的变革潜力，围绕基因编辑的伦理担忧仍持续塑造着科学进步的速度与方向。",
  template: "While no one denies the transformative potential of ______, ethical concerns about ______ continue to shape the pace and direction of ______."
},
{
  id: "S061", topic: "technology",
  sentence: "Cybersecurity threats have evolved from isolated incidents into a systemic risk that can paralyze critical infrastructure, financial systems and even democratic elections.",
  structure: "主语 + 谓语(evolve from...into...) + 定语从句(that can paralyze...)",
  translation: "网络安全威胁已从孤立事件演变为一种系统性风险，可以瘫痪关键基础设施、金融系统乃至民主选举。",
  template: "______ have evolved from ______ into a systemic risk that can paralyze ______, ______ and even ______."
},
{
  id: "S062", topic: "society",
  sentence: "An aging population poses one of the most pressing challenges facing developed economies, as fewer workers are being called upon to support an ever-growing number of retirees.",
  structure: "主语 + 谓语 + 现在分词短语(facing...) + 原因状语从句(as...)",
  translation: "人口老龄化是发达经济体面临的最紧迫挑战之一，因为越来越少的劳动者被迫供养越来越多的退休人员。",
  template: "______ poses one of the most pressing challenges facing ______, as fewer ______ are being called upon to support ______."
},
{
  id: "S063", topic: "society",
  sentence: "Immigration, though often portrayed as a source of social tension, has historically been a driver of economic vitality and cultural enrichment in host countries.",
  structure: "主语 + 让步状语(though portrayed...) + 谓语 + 表语",
  translation: "移民虽常被描绘为社会紧张的根源，但从历史上看，它一直是移入国经济活力与文化丰富性的驱动力。",
  template: "______, though often portrayed as a source of ______, has historically been a driver of ______ and ______ in ______."
},
{
  id: "S064", topic: "society",
  sentence: "The extent to which cultural heritage should be preserved in the face of rapid modernization is a question that societies around the world are struggling to answer.",
  structure: "主语从句(The extent to which...) + 谓语 + 定语从句(that...)",
  translation: "在快速现代化面前文化遗产应保留到何种程度，是全世界社会都在努力回答的问题。",
  template: "The extent to which ______ should be preserved in the face of ______ is a question that ______ are struggling to answer."
},
{
  id: "S065", topic: "society",
  sentence: "Rural depopulation, driven by the concentration of economic opportunities in urban centers, threatens to leave entire regions without the workforce needed to sustain basic services.",
  structure: "主语 + 过去分词短语(driven by...) + 谓语 + 定语从句(needed to...)",
  translation: "由经济机会集中于城市中心所驱动的乡村人口流失，可能使整片地区都缺乏维持基本服务所需的劳动力。",
  template: "______, driven by the concentration of ______ in ______, threatens to leave ______ without the ______ needed to sustain ______."
},
{
  id: "S066", topic: "society",
  sentence: "Public trust in institutions has eroded significantly in recent years, a trend that has profound implications for the functioning of democratic societies.",
  structure: "主语 + 谓语 + 同位语(a trend...) + 定语从句(that has...)",
  translation: "近年来公众对机构的信任显著下降，这一趋势对民主社会的运转具有深远影响。",
  template: "______ in ______ has eroded significantly in recent years, a trend that has profound implications for ______."
},
{
  id: "S067", topic: "society",
  sentence: "Providing affordable housing to low-income families is not merely a matter of economic policy but a fundamental question of social justice.",
  structure: "动名词主语 + not merely...but 并列表语",
  translation: "为低收入家庭提供负担得起的住房不仅是一个经济政策问题，更是一个根本性的社会公平问题。",
  template: "Providing ______ to ______ is not merely a matter of ______ but a fundamental question of ______."
},
{
  id: "S068", topic: "society",
  sentence: "Traditional gender roles, though gradually loosening in many parts of the world, continue to limit the choices available to both men and women in subtle but significant ways.",
  structure: "主语 + 让步状语(though loosening...) + 谓语 + 状语",
  translation: "传统性别角色虽在世界许多地方逐渐松动，但仍以微妙却重要的方式限制着男女双方的选择。",
  template: "______, though gradually loosening in ______, continue to limit ______ available to both ______ and ______ in subtle but significant ways."
},
{
  id: "S069", topic: "economy",
  sentence: "Inflation, particularly when it outpaces wage growth, disproportionately affects low-income households whose budgets leave little room for rising prices.",
  structure: "主语 + 插入语(particularly when...) + 谓语 + 定语从句(whose...)",
  translation: "尤其当通胀超过工资增长时，它会对低收入家庭造成不成比例的影响，因为这些家庭的预算几乎没有余地承受涨价。",
  template: "______, particularly when it outpaces ______, disproportionately affects ______ whose ______ leave little room for ______."
},
{
  id: "S070", topic: "economy",
  sentence: "The shift toward a knowledge-based economy has created enormous opportunities for skilled workers but has simultaneously left behind those without access to quality education and training.",
  structure: "主语 + 谓语 + 转折并列句 + 定语从句(without access to...)",
  translation: "向知识型经济的转型为技能型劳动者创造了巨大机会，但同时也让缺乏优质教育和培训机会的人被抛在身后。",
  template: "The shift toward ______ has created enormous opportunities for ______ but has simultaneously left behind those without access to ______."
},
{
  id: "S071", topic: "economy",
  sentence: "Free trade agreements, while boosting overall economic output, often produce winners and losers whose interests must be carefully balanced through targeted domestic policies.",
  structure: "主语 + 让步状语(while boosting...) + 谓语 + 定语从句(whose interests...)",
  translation: "自由贸易协定虽提升整体经济产出，但常制造赢家与输家，其利益必须通过有针对性的国内政策审慎平衡。",
  template: "______, while boosting overall ______, often produce winners and losers whose interests must be carefully balanced through ______."
},
{
  id: "S072", topic: "economy",
  sentence: "Central banks face the delicate task of raising interest rates enough to control inflation without triggering a recession that could throw millions out of work.",
  structure: "主语 + 谓语 + 不定式后置定语 + 定语从句(that could...)",
  translation: "央行面临的微妙任务是：加息到足以控制通胀，但又不至于引发让数百万人失业的经济衰退。",
  template: "______ face the delicate task of ______ enough to ______ without triggering ______ that could ______."
},
{
  id: "S073", topic: "economy",
  sentence: "Emerging markets, which offer attractive returns for investors willing to accept higher risk, have become an increasingly important component of the global financial system.",
  structure: "主语 + 非限制性定语从句(which offer...) + 现在分词(willing to...) + 谓语",
  translation: "为愿意承担较高风险的投资者提供丰厚回报的新兴市场，已成为全球金融体系中越来越重要的组成部分。",
  template: "______, which offer attractive returns for ______ willing to ______, have become an increasingly important component of ______."
},
{
  id: "S074", topic: "economy",
  sentence: "The transition to a green economy will require substantial upfront investment, yet the long-term savings from avoided environmental damage are likely to far exceed the initial costs.",
  structure: "主句1 + 转折连词(yet) + 主句2 + 后置定语(from...)",
  translation: "向绿色经济转型需要大量前期投资，但从避免环境损害中获得的长期节约很可能远超初期成本。",
  template: "The transition to ______ will require substantial upfront investment, yet the long-term savings from ______ are likely to far exceed ______."
},
{
  id: "S075", topic: "economy",
  sentence: "Consumer confidence, though a subjective measure, often serves as a reliable indicator of the direction in which an economy is heading over the coming quarters.",
  structure: "主语 + 让步状语(though...) + 谓语 + 定语从句(in which...)",
  translation: "消费者信心虽是一项主观指标，却常能可靠地反映一个经济体在未来几个季度的走向。",
  template: "______, though a subjective measure, often serves as a reliable indicator of ______ in which ______ is heading over ______."
},
{
  id: "S076", topic: "health",
  sentence: "Preventive healthcare, though far cheaper in the long run than treating advanced illnesses, remains chronically underfunded in most healthcare systems around the world.",
  structure: "主语 + 让步状语(though...) + 谓语 + 状语",
  translation: "预防性医疗虽从长期看比治疗晚期疾病便宜得多，但在全球多数医疗体系中长期资金不足。",
  template: "______, though far cheaper in the long run than ______, remains chronically underfunded in ______."
},
{
  id: "S077", topic: "health",
  sentence: "The COVID-19 pandemic exposed weaknesses in public health infrastructure that experts had been warning about for years, prompting long-overdue reforms in many countries.",
  structure: "主语 + 谓语 + 定语从句(that experts had been warning...) + 现在分词状语(prompting...)",
  translation: "新冠疫情暴露了公共卫生基础设施中专家多年来一直警告的弱点，推动了许多国家早该进行的改革。",
  template: "______ exposed weaknesses in ______ that experts had been warning about for years, prompting long-overdue reforms in ______."
},
{
  id: "S078", topic: "health",
  sentence: "The overuse of antibiotics has given rise to drug-resistant bacteria, a phenomenon that threatens to render even routine medical procedures dangerous.",
  structure: "主语 + 谓语 + 同位语(a phenomenon...) + 定语从句(that threatens to...)",
  translation: "抗生素滥用催生了耐药细菌，这一现象可能使即便是常规医疗操作也变得危险。",
  template: "The overuse of ______ has given rise to ______, a phenomenon that threatens to render even ______ dangerous."
},
{
  id: "S079", topic: "health",
  sentence: "Mental well-being is inextricably linked to physical health, a connection that modern medicine is only beginning to understand and integrate into everyday clinical practice.",
  structure: "主语 + 谓语 + 同位语(a connection...) + 定语从句(that modern medicine...)",
  translation: "心理健康与身体健康密不可分，现代医学才刚刚开始理解并将这种联系融入日常临床实践。",
  template: "______ is inextricably linked to ______, a connection that modern medicine is only beginning to understand and integrate into ______."
},
{
  id: "S080", topic: "health",
  sentence: "Healthcare workers, whose dedication has been repeatedly demonstrated during global emergencies, often face inadequate compensation and burnout on a scale that jeopardizes the entire system.",
  structure: "主语 + 非限制性定语从句(whose...) + 谓语 + 定语从句(that jeopardizes...)",
  translation: "医护人员的敬业精神在全球紧急事件中被反复证明，但他们常面临薪酬不足和大规模职业倦怠，威胁整个医疗系统。",
  template: "______, whose dedication has been repeatedly demonstrated during ______, often face ______ and burnout on a scale that jeopardizes ______."
},
{
  id: "S081", topic: "health",
  sentence: "It has become abundantly clear that lifestyle-related diseases, once considered problems only of affluent nations, are now spreading rapidly through developing economies.",
  structure: "形式主语it + 主语从句 + 插入语(once considered...) + 谓语",
  translation: "越来越明显的是，曾被认为仅是富裕国家问题的生活方式相关疾病，如今正快速在发展中经济体蔓延。",
  template: "It has become abundantly clear that ______, once considered problems only of ______, are now spreading rapidly through ______."
},
{
  id: "S082", topic: "health",
  sentence: "Vaccination programs have saved countless lives over the past century, yet vaccine hesitancy fueled by misinformation continues to undermine efforts to eradicate preventable diseases.",
  structure: "主句1 + 转折连词(yet) + 主句2 + 过去分词短语(fueled by...)",
  translation: "过去一个世纪，疫苗接种项目挽救了无数生命，但由虚假信息推动的疫苗犹豫仍在削弱根除可预防疾病的努力。",
  template: "______ have saved countless lives over ______, yet ______ fueled by ______ continues to undermine efforts to ______."
},
{
  id: "S083", topic: "environment",
  sentence: "Consumers who make small daily choices such as reducing meat consumption or avoiding single-use plastics can collectively generate environmental impacts far greater than they might imagine.",
  structure: "主语 + 定语从句(who...) + 举例(such as...) + 谓语 + 比较状语从句(than...)",
  translation: "在日常做出诸如减少肉食、拒绝一次性塑料等小选择的消费者，集体产生的环境影响远超他们的想象。",
  template: "______ who make small daily choices such as ______ or ______ can collectively generate ______ far greater than they might imagine."
},
{
  id: "S084", topic: "environment",
  sentence: "Governments that fail to invest in climate adaptation today will face economic and humanitarian costs many times greater in the decades to come.",
  structure: "主语 + 定语从句(that fail to...) + 谓语 + 后置定语(in the decades...)",
  translation: "今天未能投资于气候适应的政府，将在未来数十年面临成倍增长的经济与人道代价。",
  template: "______ that fail to invest in ______ today will face ______ many times greater in ______."
},
{
  id: "S085", topic: "education",
  sentence: "Teachers who inspire genuine curiosity in their students often leave a lasting impact that extends well beyond the boundaries of the classroom.",
  structure: "主语 + 定语从句(who inspire...) + 谓语 + 定语从句(that extends...)",
  translation: "能激发学生真正好奇心的教师，往往留下超越课堂边界的持久影响。",
  template: "______ who inspire ______ in their ______ often leave a lasting impact that extends well beyond ______."
},
{
  id: "S086", topic: "education",
  sentence: "The pressure to secure a place at a prestigious university has intensified to such an extent that many students sacrifice sleep, hobbies and mental health throughout their teenage years.",
  structure: "主语 + 谓语 + 结果状语(to such an extent that...)",
  translation: "进入名校的压力已增至如此程度，许多学生在整个青少年时期都牺牲了睡眠、爱好和心理健康。",
  template: "The pressure to ______ has intensified to such an extent that many ______ sacrifice ______, ______ and ______ throughout ______."
},
{
  id: "S087", topic: "technology",
  sentence: "The rapid pace at which artificial intelligence is being adopted across industries has left regulators struggling to keep up, creating a policy vacuum that could prove costly.",
  structure: "主语 + 定语从句(at which...) + 谓语 + 现在分词状语(creating...) + 定语从句(that could...)",
  translation: "人工智能在各行业被采用的速度之快让监管机构疲于应付，制造出可能代价高昂的政策真空。",
  template: "The rapid pace at which ______ is being adopted across ______ has left ______ struggling to keep up, creating ______ that could prove costly."
},
{
  id: "S088", topic: "technology",
  sentence: "Remote work, made possible by advances in communication technology, has fundamentally altered the relationship between employees and employers in ways that will persist long after the pandemic ends.",
  structure: "主语 + 过去分词短语(made possible by...) + 谓语 + 定语从句(that will persist...)",
  translation: "通信技术进步使远程办公成为可能，它从根本上改变了雇员与雇主的关系，这种影响将在疫情结束后长期持续。",
  template: "______, made possible by advances in ______, has fundamentally altered the relationship between ______ and ______ in ways that will persist ______."
},
{
  id: "S089", topic: "society",
  sentence: "Whether globalization has been a net positive for humanity remains a matter of intense debate, with valid arguments to be made on both sides.",
  structure: "Whether 主语从句 + 谓语 + 独立主格结构(with...)",
  translation: "全球化对人类整体是否利大于弊仍是激烈争论的话题，正反双方都有站得住脚的论据。",
  template: "Whether ______ has been a net positive for ______ remains a matter of intense debate, with valid arguments to be made on ______."
},
{
  id: "S090", topic: "society",
  sentence: "The role of the family in shaping individual character has been diminished, though by no means eliminated, by the rise of digital media and peer influence.",
  structure: "主语 + 被动谓语 + 插入语(though...) + 施动者(by...)",
  translation: "在塑造个人品格方面，家庭的作用因数字媒体和同伴影响的兴起而被削弱，但绝未消失。",
  template: "The role of ______ in shaping ______ has been diminished, though by no means eliminated, by the rise of ______ and ______."
},
{
  id: "S091", topic: "economy",
  sentence: "Fiscal stimulus during economic downturns, though effective in cushioning immediate hardship, often creates long-term debt burdens that future generations must shoulder.",
  structure: "主语 + 让步状语(though...) + 谓语 + 定语从句(that future...)",
  translation: "经济下行期的财政刺激虽能有效缓冲当下困境，但常制造未来几代人必须承担的长期债务负担。",
  template: "______ during economic downturns, though effective in cushioning ______, often creates ______ that future generations must shoulder."
},
{
  id: "S092", topic: "economy",
  sentence: "Cryptocurrency, hailed by some as the future of finance and dismissed by others as speculative bubble, continues to divide opinion among economists and regulators worldwide.",
  structure: "主语 + 并列过去分词短语(hailed...and dismissed...) + 谓语",
  translation: "被一些人誉为金融未来、被另一些人斥为投机泡沫的加密货币，仍持续在全球经济学家与监管者之间引发分歧。",
  template: "______, hailed by some as ______ and dismissed by others as ______, continues to divide opinion among ______."
},
{
  id: "S093", topic: "health",
  sentence: "Access to nutritious food, clean water and safe housing constitutes a foundation without which no genuine improvement in public health can be achieved.",
  structure: "主语 + 谓语 + 表语 + 定语从句(without which...)",
  translation: "获得营养食物、清洁水源和安全住房构成了公共健康真正改善不可或缺的基础。",
  template: "Access to ______, ______ and ______ constitutes a foundation without which no genuine improvement in ______ can be achieved."
},
{
  id: "S094", topic: "health",
  sentence: "Chronic sleep deprivation, endemic in modern urban life, has been linked to a wide array of health problems ranging from cardiovascular disease to impaired cognitive function.",
  structure: "主语 + 形容词短语(endemic in...) + 被动谓语 + 现在分词短语(ranging from...to...)",
  translation: "长期睡眠不足在现代都市生活中普遍存在，已被证明与从心血管疾病到认知功能受损的各种健康问题相关。",
  template: "______, endemic in ______, has been linked to a wide array of ______ ranging from ______ to ______."
},
{
  id: "S095", topic: "environment",
  sentence: "The transition away from fossil fuels represents not just an environmental necessity but also an economic opportunity for nations willing to invest in emerging clean technologies.",
  structure: "主语 + 谓语 + not just...but also 并列表语 + 定语关系(for nations willing to...)",
  translation: "摆脱化石燃料的转型不仅是环保必需，也是愿意投资新兴清洁技术国家的经济机遇。",
  template: "The transition away from ______ represents not just ______ but also ______ for ______ willing to invest in ______."
},
{
  id: "S096", topic: "environment",
  sentence: "Even the most ambitious international climate agreements will remain little more than words on paper unless they are backed by concrete enforcement mechanisms.",
  structure: "让步主句(Even...) + 条件状语从句(unless...) + 被动语态",
  translation: "即便最雄心勃勃的国际气候协议，若没有具体的执行机制支撑，也不过是纸上空文。",
  template: "Even the most ambitious ______ will remain little more than ______ unless they are backed by ______."
},
{
  id: "S097", topic: "education",
  sentence: "It is only through sustained investment in teacher training that education systems can hope to deliver on the promise of equal opportunity for every child.",
  structure: "强调句(It is...that...) + only through 状语",
  translation: "唯有通过对教师培训的持续投入，教育系统才能兑现让每个孩子获得平等机会的承诺。",
  template: "It is only through sustained investment in ______ that ______ can hope to deliver on the promise of ______ for ______."
},
{
  id: "S098", topic: "technology",
  sentence: "The extent to which our lives depend on digital infrastructure becomes painfully apparent whenever a major outage disrupts services that we take for granted.",
  structure: "主语从句(The extent to which...) + 谓语 + 时间状语从句(whenever...) + 定语从句(that...)",
  translation: "每当重大服务中断打断我们习以为常的服务时，我们的生活对数字基础设施的依赖程度就变得痛苦地清晰。",
  template: "The extent to which ______ depend on ______ becomes painfully apparent whenever ______ disrupts ______ that we take for granted."
},
{
  id: "S099", topic: "society",
  sentence: "Volunteerism thrives in communities where citizens feel a genuine sense of belonging, whereas atomized societies struggle to mobilize collective action even for urgent causes.",
  structure: "主语1 + 谓语 + 定语从句(where...) + 转折连词(whereas) + 主语2 + 谓语",
  translation: "在公民有真正归属感的社区中，志愿服务蓬勃发展；而原子化的社会则难以为即便紧迫的事业动员集体行动。",
  template: "______ thrives in ______ where ______ feel a genuine sense of ______, whereas ______ societies struggle to mobilize ______ even for ______."
},
{
  id: "S100", topic: "economy",
  sentence: "Labor markets are being reshaped by forces so powerful and rapid that workers who fail to continuously upgrade their skills risk being left permanently behind.",
  structure: "主语 + 被动谓语 + 结果状语(so...that...) + 定语从句(who fail to...)",
  translation: "劳动力市场正被如此强大且迅速的力量重塑，以致未能持续提升技能的劳动者面临被永远抛在后面的风险。",
  template: "______ are being reshaped by forces so powerful and rapid that ______ who fail to continuously ______ risk being left permanently behind."
},
{
  id: "S101", topic: "health",
  sentence: "The stigma surrounding mental illness prevents countless individuals from seeking the help they need, contributing to a public health crisis that hides in plain sight.",
  structure: "主语 + 现在分词短语(surrounding...) + 谓语 + 定语从句(they need) + 现在分词状语(contributing to...)",
  translation: "围绕精神疾病的污名使无数人不敢寻求所需帮助，助长了一场明摆着却被忽视的公共健康危机。",
  template: "The stigma surrounding ______ prevents ______ from seeking the help they need, contributing to ______ that hides in plain sight."
},
{
  id: "S102", topic: "environment",
  sentence: "Sustainable agriculture practices, once seen as niche experiments, are gaining mainstream traction as farmers recognize the long-term risks of soil degradation and water depletion.",
  structure: "主语 + 过去分词短语(once seen as...) + 谓语 + 原因状语从句(as...)",
  translation: "曾被视为小众实验的可持续农业实践正获得主流关注，因为农民认识到土壤退化和水源枯竭的长期风险。",
  template: "______, once seen as ______, are gaining mainstream traction as ______ recognize the long-term risks of ______ and ______."
},
{
  id: "S103", topic: "education",
  sentence: "A well-rounded education prepares students not merely to earn a living but to lead thoughtful, engaged lives as informed citizens of a complex world.",
  structure: "主语 + 谓语 + not merely...but 并列不定式 + 同位语",
  translation: "全面的教育不仅培养学生谋生的能力，更让他们作为复杂世界中知情的公民，过上有思想、有参与感的生活。",
  template: "A well-rounded ______ prepares ______ not merely to ______ but to ______ as ______ of ______."
},
{
  id: "S104", topic: "technology",
  sentence: "The very technologies that connect us more efficiently than ever before have also, paradoxically, been blamed for a rising tide of loneliness and social isolation.",
  structure: "主语 + 定语从句(that connect...) + 谓语 + 插入语(paradoxically) + 被动语态",
  translation: "让我们前所未有高效连接的这些技术，矛盾的是，也被指责为孤独和社会隔离浪潮上升的原因。",
  template: "The very ______ that connect us more efficiently than ever before have also, paradoxically, been blamed for ______ and ______."
},
{
  id: "S105", topic: "society",
  sentence: "Attitudes toward marriage and family have shifted dramatically over the past half-century, reflecting broader changes in gender roles, economic opportunity and personal aspiration.",
  structure: "主语 + 谓语 + 现在分词状语(reflecting...) + 三项并列宾语",
  translation: "过去半个世纪里，人们对婚姻和家庭的态度发生了巨大变化，反映了性别角色、经济机会和个人抱负的更广泛变迁。",
  template: "Attitudes toward ______ and ______ have shifted dramatically over ______, reflecting broader changes in ______, ______ and ______."
},
{
  id: "S106", topic: "economy",
  sentence: "Wealth inequality has reached levels not seen in a century, a development that many economists warn could destabilize both markets and democratic institutions.",
  structure: "主语 + 谓语 + 过去分词后置定语(not seen...) + 同位语(a development...) + 定语从句(that...)",
  translation: "贫富不平等已达到一个世纪未见的水平，许多经济学家警告这一进展可能同时动摇市场和民主制度。",
  template: "______ has reached levels not seen in ______, a development that many ______ warn could destabilize both ______ and ______."
},
{
  id: "S107", topic: "health",
  sentence: "Air pollution has been shown to shorten average life expectancy by years in the world's most affected cities, making it as much a health emergency as an environmental one.",
  structure: "主语 + 被动谓语 + 不定式 + 现在分词状语(making it...as...as...)",
  translation: "研究表明，在世界受影响最严重的城市，空气污染将平均预期寿命缩短数年，使其既是环境紧急事件也是健康紧急事件。",
  template: "______ has been shown to shorten ______ by years in ______, making it as much ______ as ______."
},
{
  id: "S108", topic: "environment",
  sentence: "The oceans, which absorb roughly a quarter of all human carbon emissions, are becoming increasingly acidic, threatening ecosystems on which billions of people depend for food.",
  structure: "主语 + 非限制性定语从句(which absorb...) + 谓语 + 现在分词状语(threatening...) + 定语从句(on which...)",
  translation: "海洋吸收了人类碳排放的约四分之一，正日益酸化，威胁着数十亿人赖以获得食物的生态系统。",
  template: "______, which absorb roughly ______ of ______, are becoming increasingly ______, threatening ______ on which ______ depend for ______."
},
{
  id: "S109", topic: "education",
  sentence: "Reading habits established in childhood tend to persist into adulthood, shaping not only academic outcomes but also the breadth of an individual's intellectual life.",
  structure: "主语 + 过去分词短语(established in...) + 谓语 + 现在分词状语(shaping not only...but also...)",
  translation: "童年养成的阅读习惯往往延续至成年，不仅塑造学业成果，也塑造个人智识生活的广度。",
  template: "______ habits established in ______ tend to persist into ______, shaping not only ______ but also ______ of ______."
},
{
  id: "S110", topic: "technology",
  sentence: "For all its promise, artificial intelligence remains only as reliable as the data on which it is trained, and biased data inevitably produces biased outcomes.",
  structure: "让步状语(For all...) + 主句 + 定语从句(on which...) + 并列句(and...)",
  translation: "尽管前景光明，人工智能的可靠性也只与训练它的数据相当，有偏见的数据必然产生有偏见的结果。",
  template: "For all its promise, ______ remains only as reliable as ______ on which it is trained, and biased ______ inevitably produces biased ______."
},
{
  id: "S111", topic: "society",
  sentence: "A society's treatment of its most vulnerable members—children, the elderly and the disabled—serves as perhaps the most telling measure of its moral progress.",
  structure: "主语 + 破折号同位语 + 谓语 + 表语",
  translation: "一个社会对待其最脆弱群体（儿童、老人和残疾人）的方式，或许是衡量其道德进步最能说明问题的标尺。",
  template: "A society's treatment of ______—______, ______ and ______—serves as perhaps the most telling measure of ______."
},
{
  id: "S112", topic: "economy",
  sentence: "Small businesses, often described as the backbone of the economy, face challenges that large corporations, with their vast resources, can easily absorb but that can prove fatal to entrepreneurs.",
  structure: "主语 + 过去分词短语(often described as...) + 谓语 + 定语从句(that large corporations...but that can prove fatal...)",
  translation: "常被誉为经济支柱的小企业面临的挑战，大公司凭借雄厚资源可以轻易化解，但对创业者却可能致命。",
  template: "______, often described as the backbone of ______, face challenges that ______, with their ______, can easily absorb but that can prove fatal to ______."
},
{
  id: "S113", topic: "health",
  sentence: "The growing recognition that mental and physical health are inseparable is prompting healthcare systems to move away from siloed treatment toward more integrated models of care.",
  structure: "主语 + 同位语从句(that...) + 谓语 + 不定式宾语",
  translation: "对心理健康与身体健康密不可分的日益认识，正推动医疗系统摒弃孤立治疗，转向更整合的医疗模式。",
  template: "The growing recognition that ______ and ______ are inseparable is prompting ______ to move away from ______ toward more integrated models of ______."
},
{
  id: "S114", topic: "environment",
  sentence: "Individual actions alone cannot solve the climate crisis, yet they matter enormously in shaping the collective political will needed to compel systemic change.",
  structure: "主句1 + 转折连词(yet) + 主句2 + 过去分词短语(needed to...)",
  translation: "个人行动本身无法解决气候危机，但它们在塑造推动系统性变革所需的集体政治意愿方面至关重要。",
  template: "______ alone cannot solve ______, yet they matter enormously in shaping ______ needed to ______."
},
{
  id: "S115", topic: "education",
  sentence: "Access to higher education, while expanded significantly over recent decades, still remains unevenly distributed along lines of income, geography and ethnicity.",
  structure: "主语 + 让步状语(while expanded...) + 谓语 + 后置状语(along lines of...)",
  translation: "尽管近几十年来大幅扩展，高等教育机会仍沿着收入、地域和族裔的界线分布不均。",
  template: "Access to ______, while expanded significantly over ______, still remains unevenly distributed along lines of ______, ______ and ______."
},
{
  id: "S116", topic: "technology",
  sentence: "The promise of self-driving vehicles has yet to translate into widespread reality, largely because the technology must reach a level of safety that far exceeds what human drivers achieve.",
  structure: "主语 + 谓语 + 原因状语从句(because...) + 定语从句(that far exceeds...) + 宾语从句(what...)",
  translation: "自动驾驶汽车的前景尚未转化为普遍现实，主要因为该技术必须达到远超人类驾驶员的安全水平。",
  template: "The promise of ______ has yet to translate into widespread reality, largely because ______ must reach a level of ______ that far exceeds what ______ achieve."
},
{
  id: "S117", topic: "society",
  sentence: "Cultural exchange, when approached with mutual respect, enriches all parties involved and helps break down stereotypes that have divided communities for generations.",
  structure: "主语 + 插入语(when...) + 并列谓语 + 定语从句(that have divided...)",
  translation: "以相互尊重的态度进行的文化交流，能丰富所有参与方，并有助于打破几代人以来分裂社区的刻板印象。",
  template: "______, when approached with ______, enriches all parties involved and helps break down ______ that have divided ______ for generations."
},
{
  id: "S118", topic: "economy",
  sentence: "Tax policy, though often portrayed as a purely technical matter, is in fact one of the most powerful tools by which societies express their values and priorities.",
  structure: "主语 + 让步状语(though portrayed...) + 谓语 + 定语从句(by which...)",
  translation: "税收政策虽常被描绘为纯粹的技术问题，实际上是社会表达其价值观与优先事项最有力的工具之一。",
  template: "______, though often portrayed as a purely technical matter, is in fact one of the most powerful tools by which ______ express ______ and ______."
},
{
  id: "S119", topic: "health",
  sentence: "The global disparity in healthcare quality, laid bare during recent pandemics, has renewed calls for international cooperation to build resilient health systems everywhere.",
  structure: "主语 + 过去分词短语(laid bare...) + 谓语 + 不定式后置定语",
  translation: "近年疫情暴露的全球医疗质量差距，重新引发对国际合作以在各地建立韧性医疗系统的呼吁。",
  template: "The global disparity in ______, laid bare during ______, has renewed calls for ______ to build resilient ______ everywhere."
},
{
  id: "S120", topic: "environment",
  sentence: "The choices made by this generation regarding energy, consumption and land use will determine, more than anything else, the world that our children and grandchildren inherit.",
  structure: "主语 + 过去分词短语(made by...) + 现在分词短语(regarding...) + 谓语 + 插入语(more than...) + 定语从句(that our children...)",
  translation: "这一代人在能源、消费和土地利用方面所做的选择，将比任何其他因素都更能决定我们子孙后代所继承的世界。",
  template: "The choices made by ______ regarding ______, ______ and ______ will determine, more than anything else, ______ that ______ inherit."
}
];
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
    alert("正在加载云端学习记录，请稍后再开始学习。"");
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
