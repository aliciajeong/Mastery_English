import { useState, useCallback, useRef } from "react";
// ═══ UTILITIES ═══
function mulberry32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}}
function hashStr(s){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(31,h)+s.charCodeAt(i))|0;return h;}
function shuffle(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(arr,n,rng){return shuffle(arr,rng).slice(0,n);}
function todayStr(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtDate(s){const[y,m,d]=s.split("-");return`${m}/${d}`;}

// ═══ PERSISTENT STORAGE ═══
const STORAGE_KEY="eng_mastery_v3";
function loadData(){try{const d=localStorage.getItem(STORAGE_KEY);return d?JSON.parse(d):{scores:{},settings:{examType:"ielts"},lastSeen:null};}catch{return{scores:{},settings:{examType:"ielts"},lastSeen:null};}}
function saveData(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){console.warn("Storage save failed",e);}}
function exportData(data){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`english-mastery-backup-${todayStr()}.json`;a.click();URL.revokeObjectURL(url);}

// ═══ UPDATE NOTIFICATION SYSTEM ═══
const APP_VERSION="3.2.0";
const UPDATES=[
  {ver:"3.2.0",date:"2026-05-09",title:"V3.2 업데이트!",items:["단어 카드에 예문(Example Sentence) 추가","청취 지문 3편으로 확대 (AI·면접 추가)","어휘 퀴즈 오답 시 정답 표시 개선","Reading 결과 화면에 돌아가기 버튼 추가","학습 기록에 연속 학습일(Streak) 표시","문법 검사 패턴 10개 추가 강화","Speaking 분석 세분화 및 팁 보강"]},
  {ver:"3.0.1",date:"2026-04-12",title:"V3 출시!",items:["IELTS/PTE 전환 기능","각 섹션 20문제로 확대","복습 탭 추가","TTS 발음 (미국/영국/호주)","Writing 전문가 피드백","Speaking 녹음 & 분석","데이터 백업/복원 기능","업데이트 알림 시스템"]},
];

// ═══ THEME ═══
const C={
  bg:"#060a12",bg2:"#0b1018",card:"#10182b",card2:"#152035",
  accent:"#00e6a7",accent2:"#00c48f",glow:"rgba(0,230,167,0.1)",
  text:"#e4e9f2",dim:"#8a9ab5",muted:"#4d5f7a",
  ok:"#22c55e",no:"#ef4444",warn:"#f59e0b",
  blue:"#3b82f6",purple:"#a78bfa",pink:"#ec4899",cyan:"#06b6d4",
  border:"#1a2540",input:"#080e1c",
  ielts:"#ef4444",pte:"#eab308",
};
const F={h:"'Sora',sans-serif",b:"'Sora',sans-serif",m:"'Fira Code',monospace"};

// ═══ VOCABULARY DATABASE (80 words) ═══
const VOCAB=[
{w:"Ubiquitous",k:"어디에나 있는",p:"/juːˈbɪkwɪtəs/",lv:"고급",syn:["Omnipresent","Pervasive"],ant:["Rare","Scarce"],sim:["Prevalent","Widespread"],ex:"Smartphones have become ubiquitous in modern society, transforming how people communicate."},
{w:"Ameliorate",k:"개선하다",p:"/əˈmiːliəreɪt/",lv:"고급",syn:["Improve","Enhance"],ant:["Worsen","Deteriorate"],sim:["Alleviate","Rectify"],ex:"Government policies aim to ameliorate the living conditions of vulnerable communities."},
{w:"Pragmatic",k:"실용적인",p:"/præɡˈmætɪk/",lv:"중급",syn:["Practical","Realistic"],ant:["Idealistic","Impractical"],sim:["Sensible","Down-to-earth"],ex:"A pragmatic approach to education focuses on skills students can apply in real life."},
{w:"Ephemeral",k:"일시적인",p:"/ɪˈfemərəl/",lv:"고급",syn:["Transient","Fleeting"],ant:["Permanent","Enduring"],sim:["Short-lived","Momentary"],ex:"Social media trends are often ephemeral, disappearing as quickly as they emerge."},
{w:"Exacerbate",k:"악화시키다",p:"/ɪɡˈzæsərbeɪt/",lv:"고급",syn:["Aggravate","Worsen"],ant:["Alleviate","Mitigate"],sim:["Intensify","Compound"],ex:"Rapid deforestation can exacerbate climate change by reducing carbon absorption."},
{w:"Paradigm",k:"패러다임, 모범",p:"/ˈpærədaɪm/",lv:"중급",syn:["Model","Framework"],ant:["Anomaly"],sim:["Archetype","Standard"],ex:"The internet represented a paradigm shift in how information is accessed and shared."},
{w:"Mitigate",k:"완화하다",p:"/ˈmɪtɪɡeɪt/",lv:"중급",syn:["Alleviate","Reduce"],ant:["Aggravate","Intensify"],sim:["Ease","Moderate"],ex:"Urban planners introduced green spaces to mitigate the effects of air pollution."},
{w:"Eloquent",k:"웅변의, 유창한",p:"/ˈeləkwənt/",lv:"중급",syn:["Articulate","Fluent"],ant:["Inarticulate"],sim:["Expressive","Silver-tongued"],ex:"The scholar delivered an eloquent speech on the importance of cultural diversity."},
{w:"Unprecedented",k:"전례 없는",p:"/ʌnˈpresɪdentɪd/",lv:"중급",syn:["Unparalleled","Novel"],ant:["Common","Typical"],sim:["Groundbreaking","Extraordinary"],ex:"The pandemic caused an unprecedented disruption to global supply chains."},
{w:"Scrutinize",k:"면밀히 조사하다",p:"/ˈskruːtənaɪz/",lv:"고급",syn:["Examine","Inspect"],ant:["Glance","Overlook"],sim:["Analyze","Probe"],ex:"Researchers scrutinize data carefully to ensure their conclusions are accurate."},
{w:"Resilient",k:"회복력 있는",p:"/rɪˈzɪliənt/",lv:"중급",syn:["Tough","Hardy"],ant:["Fragile","Vulnerable"],sim:["Adaptable","Robust"],ex:"Resilient communities are better equipped to recover from natural disasters."},
{w:"Ambiguous",k:"모호한",p:"/æmˈbɪɡjuəs/",lv:"중급",syn:["Vague","Unclear"],ant:["Clear","Definite"],sim:["Equivocal","Nebulous"],ex:"The policy's ambiguous wording led to widespread confusion among those trying to implement it."},
{w:"Meticulous",k:"꼼꼼한",p:"/məˈtɪkjələs/",lv:"중급",syn:["Thorough","Precise"],ant:["Careless","Sloppy"],sim:["Painstaking","Scrupulous"],ex:"The architect was meticulous in reviewing every detail of the construction plans."},
{w:"Inevitable",k:"피할 수 없는",p:"/ɪnˈevɪtəbl/",lv:"중급",syn:["Unavoidable","Certain"],ant:["Avoidable","Preventable"],sim:["Inescapable","Destined"],ex:"With growing populations, urban expansion seems inevitable in many regions around the world."},
{w:"Conundrum",k:"난제",p:"/kəˈnʌndrəm/",lv:"고급",syn:["Puzzle","Dilemma"],ant:["Solution"],sim:["Enigma","Quandary"],ex:"How to balance economic growth with environmental protection remains a central conundrum."},
{w:"Proliferate",k:"급증하다",p:"/prəˈlɪfəreɪt/",lv:"고급",syn:["Multiply","Spread"],ant:["Decrease","Diminish"],sim:["Expand","Burgeon"],ex:"Online learning platforms have proliferated in response to growing demand for flexible education."},
{w:"Stringent",k:"엄격한",p:"/ˈstrɪndʒənt/",lv:"중급",syn:["Strict","Rigorous"],ant:["Lenient","Lax"],sim:["Severe","Exacting"],ex:"Stringent environmental regulations are necessary to protect natural habitats from exploitation."},
{w:"Volatile",k:"변덕스러운",p:"/ˈvɒlətaɪl/",lv:"중급",syn:["Unstable","Unpredictable"],ant:["Stable","Steady"],sim:["Erratic","Turbulent"],ex:"The global oil market is notoriously volatile, with prices fluctuating dramatically over time."},
{w:"Consensus",k:"합의",p:"/kənˈsensəs/",lv:"중급",syn:["Agreement","Accord"],ant:["Disagreement","Discord"],sim:["Unanimity","Harmony"],ex:"Scientists have reached a consensus that human activity is the primary driver of climate change."},
{w:"Detrimental",k:"해로운",p:"/ˌdetrɪˈmentl/",lv:"중급",syn:["Harmful","Damaging"],ant:["Beneficial"],sim:["Injurious","Adverse"],ex:"Excessive screen time can be detrimental to children's cognitive development and social skills."},
{w:"Coherent",k:"일관성 있는",p:"/koʊˈhɪrənt/",lv:"중급",syn:["Logical","Consistent"],ant:["Incoherent"],sim:["Lucid","Rational"],ex:"A coherent argument presents ideas in a logical, well-organized manner that readers can follow."},
{w:"Substantiate",k:"입증하다",p:"/səbˈstænʃieɪt/",lv:"고급",syn:["Verify","Confirm"],ant:["Disprove","Refute"],sim:["Corroborate","Validate"],ex:"The researcher used extensive statistical data to substantiate her hypothesis about urban poverty."},
{w:"Conducive",k:"도움이 되는",p:"/kənˈdjuːsɪv/",lv:"고급",syn:["Favorable","Beneficial"],ant:["Hindering"],sim:["Propitious","Contributory"],ex:"A quiet, well-lit environment is conducive to focused study and productive learning."},
{w:"Disparity",k:"격차",p:"/dɪˈspærəti/",lv:"중급",syn:["Inequality","Gap"],ant:["Equality","Parity"],sim:["Discrepancy","Imbalance"],ex:"The growing disparity in wealth between nations threatens global economic stability."},
{w:"Tangible",k:"유형의, 실질적인",p:"/ˈtændʒəbl/",lv:"중급",syn:["Concrete","Real"],ant:["Intangible","Abstract"],sim:["Palpable","Material"],ex:"The program produced tangible results, with unemployment rates falling by ten percent."},
{w:"Perpetuate",k:"영속시키다",p:"/pərˈpetʃueɪt/",lv:"고급",syn:["Continue","Sustain"],ant:["Stop","End"],sim:["Prolong","Preserve"],ex:"Stereotypes can perpetuate inequalities by shaping perceptions and limiting opportunities."},
{w:"Succinct",k:"간결한",p:"/səkˈsɪŋkt/",lv:"중급",syn:["Concise","Brief"],ant:["Verbose"],sim:["Terse","Pithy"],ex:"A succinct summary of the lengthy report was prepared for busy policymakers."},
{w:"Arbitrary",k:"임의의",p:"/ˈɑːrbɪtreri/",lv:"중급",syn:["Random","Capricious"],ant:["Systematic"],sim:["Whimsical","Haphazard"],ex:"Critics argued that the policy change was arbitrary and lacked any clear justification."},
{w:"Commensurate",k:"비례하는",p:"/kəˈmenʃərət/",lv:"고급",syn:["Proportionate","Equivalent"],ant:["Disproportionate"],sim:["Corresponding","Comparable"],ex:"Employees expect salaries commensurate with their level of education and professional experience."},
{w:"Fluctuate",k:"변동하다",p:"/ˈflʌktʃueɪt/",lv:"중급",syn:["Vary","Oscillate"],ant:["Stabilize"],sim:["Waver","Vacillate"],ex:"Exchange rates fluctuate daily in response to shifting global economic conditions."},
{w:"Comprehensive",k:"포괄적인",p:"/ˌkɒmprɪˈhensɪv/",lv:"중급",syn:["Thorough","Extensive"],ant:["Limited","Narrow"],sim:["Exhaustive","All-inclusive"],ex:"The report provided a comprehensive overview of all factors affecting public health outcomes."},
{w:"Articulate",k:"명확히 표현하다",p:"/ɑːrˈtɪkjuleɪt/",lv:"중급",syn:["Express","Convey"],ant:["Mumble"],sim:["Enunciate","Communicate"],ex:"She was able to articulate complex scientific ideas with remarkable clarity in her presentation."},
{w:"Deteriorate",k:"악화되다",p:"/dɪˈtɪriəreɪt/",lv:"중급",syn:["Decline","Worsen"],ant:["Improve"],sim:["Degrade","Degenerate"],ex:"Air quality in the city continued to deteriorate as industrial output increased each year."},
{w:"Pertinent",k:"관련된",p:"/ˈpɜːrtɪnənt/",lv:"중급",syn:["Relevant","Applicable"],ant:["Irrelevant"],sim:["Germane","Apposite"],ex:"The lawyer raised several pertinent questions about the validity of the key evidence."},
{w:"Elicit",k:"이끌어내다",p:"/ɪˈlɪsɪt/",lv:"고급",syn:["Evoke","Extract"],ant:["Suppress"],sim:["Draw out","Provoke"],ex:"The teacher used open-ended questions to elicit deeper thinking and discussion from students."},
{w:"Plausible",k:"그럴듯한",p:"/ˈplɔːzəbl/",lv:"중급",syn:["Credible","Believable"],ant:["Implausible"],sim:["Feasible","Conceivable"],ex:"The scientist offered a plausible explanation for the unexpected results observed in the experiment."},
{w:"Inherent",k:"내재된",p:"/ɪnˈhɪrənt/",lv:"중급",syn:["Intrinsic","Innate"],ant:["Extrinsic"],sim:["Built-in","Essential"],ex:"There are inherent risks in any form of financial investment, regardless of market conditions."},
{w:"Discrepancy",k:"불일치",p:"/dɪˈskrepənsi/",lv:"중급",syn:["Inconsistency","Difference"],ant:["Agreement"],sim:["Variance","Divergence"],ex:"A discrepancy between the two financial reports immediately raised concerns about data accuracy."},
{w:"Feasible",k:"실현 가능한",p:"/ˈfiːzəbl/",lv:"중급",syn:["Possible","Viable"],ant:["Impossible"],sim:["Achievable","Workable"],ex:"Experts debated whether the proposed high-speed rail project was feasible within the budget."},
{w:"Corroborate",k:"확증하다",p:"/kəˈrɒbəreɪt/",lv:"고급",syn:["Confirm","Verify"],ant:["Contradict"],sim:["Substantiate","Authenticate"],ex:"Additional eyewitness accounts corroborated the journalist's initial findings about corruption."},
{w:"Proponent",k:"지지자",p:"/prəˈpoʊnənt/",lv:"고급",syn:["Advocate","Supporter"],ant:["Opponent","Critic"],sim:["Champion","Backer"],ex:"She was a leading proponent of renewable energy reform in the national parliament."},
{w:"Superfluous",k:"불필요한",p:"/suːˈpɜːrfluəs/",lv:"고급",syn:["Excessive","Redundant"],ant:["Essential"],sim:["Surplus","Extraneous"],ex:"The editor removed superfluous adjectives from the draft to make the writing more concise."},
{w:"Nuance",k:"미묘한 차이",p:"/ˈnjuːɑːns/",lv:"중급",syn:["Subtlety","Shade"],ant:[],sim:["Distinction","Refinement"],ex:"Understanding the nuance of a language is essential for effective cross-cultural communication."},
{w:"Pervasive",k:"만연한",p:"/pərˈveɪsɪv/",lv:"고급",syn:["Widespread","Prevalent"],ant:["Rare"],sim:["Ubiquitous","Rampant"],ex:"The influence of social media has become pervasive across all demographics and age groups."},
{w:"Undermine",k:"약화시키다",p:"/ˌʌndərˈmaɪn/",lv:"중급",syn:["Weaken","Sabotage"],ant:["Strengthen"],sim:["Subvert","Erode"],ex:"Widespread corruption can undermine public trust in democratic institutions over time."},
{w:"Impediment",k:"장애",p:"/ɪmˈpedɪmənt/",lv:"고급",syn:["Obstacle","Hindrance"],ant:["Aid"],sim:["Barrier","Encumbrance"],ex:"Language barriers are a significant impediment to successful integration for new immigrants."},
{w:"Augment",k:"증가시키다",p:"/ɔːɡˈment/",lv:"중급",syn:["Increase","Enhance"],ant:["Decrease"],sim:["Supplement","Boost"],ex:"Technology can augment human productivity by automating routine and repetitive tasks."},
{w:"Benevolent",k:"자선적인",p:"/bəˈnevələnt/",lv:"중급",syn:["Kind","Charitable"],ant:["Malevolent"],sim:["Generous","Altruistic"],ex:"The benevolent organization donated millions of dollars to fund educational initiatives worldwide."},
{w:"Catalyst",k:"촉매",p:"/ˈkætəlɪst/",lv:"중급",syn:["Stimulus","Trigger"],ant:["Inhibitor"],sim:["Impetus","Spark"],ex:"The financial crisis served as a catalyst for sweeping regulatory reform across the banking sector."},
{w:"Eradicate",k:"근절하다",p:"/ɪˈrædɪkeɪt/",lv:"고급",syn:["Eliminate","Destroy"],ant:["Create"],sim:["Abolish","Annihilate"],ex:"Global health campaigns have worked tirelessly to eradicate infectious diseases such as polio."},
{w:"Facilitate",k:"촉진하다",p:"/fəˈsɪlɪteɪt/",lv:"중급",syn:["Ease","Enable"],ant:["Hinder"],sim:["Expedite","Streamline"],ex:"Digital communication tools facilitate collaboration between researchers working across different countries."},
{w:"Gregarious",k:"사교적인",p:"/ɡrɪˈɡeəriəs/",lv:"고급",syn:["Sociable","Outgoing"],ant:["Introverted"],sim:["Convivial","Affable"],ex:"The gregarious student quickly formed friendships with every member of her new class."},
{w:"Innate",k:"선천적인",p:"/ɪˈneɪt/",lv:"중급",syn:["Inborn","Natural"],ant:["Learned"],sim:["Inherent","Intrinsic"],ex:"Some researchers believe that curiosity and creativity are innate traits present from birth."},
{w:"Lucrative",k:"수익성 있는",p:"/ˈluːkrətɪv/",lv:"중급",syn:["Profitable","Rewarding"],ant:["Unprofitable"],sim:["Gainful","Remunerative"],ex:"The pharmaceutical industry is one of the most lucrative sectors in the global economy."},
{w:"Negligible",k:"무시할 정도의",p:"/ˈneɡlɪdʒəbl/",lv:"중급",syn:["Insignificant","Trivial"],ant:["Significant"],sim:["Minor","Inconsequential"],ex:"The environmental impact of the proposed project was deemed negligible by the review committee."},
{w:"Prolific",k:"다작의",p:"/prəˈlɪfɪk/",lv:"중급",syn:["Productive","Fertile"],ant:["Unproductive"],sim:["Abundant","Copious"],ex:"The prolific author published more than thirty acclaimed novels during his long career."},
{w:"Refute",k:"반박하다",p:"/rɪˈfjuːt/",lv:"중급",syn:["Disprove","Deny"],ant:["Confirm"],sim:["Rebut","Counter"],ex:"The scientist published new data to refute the widely held misconception about the disease."},
{w:"Tenacious",k:"끈질긴",p:"/tɪˈneɪʃəs/",lv:"고급",syn:["Persistent","Determined"],ant:["Yielding"],sim:["Resolute","Dogged"],ex:"Her tenacious commitment to research ultimately led to a significant medical breakthrough."},
{w:"Vindicate",k:"정당성을 입증하다",p:"/ˈvɪndɪkeɪt/",lv:"고급",syn:["Justify","Exonerate"],ant:["Blame"],sim:["Clear","Absolve"],ex:"The court ruling served to vindicate the activist's long campaign for social justice."},
{w:"Acquiesce",k:"묵묵히 따르다",p:"/ˌækwiˈes/",lv:"고급",syn:["Comply","Consent"],ant:["Resist"],sim:["Submit","Yield"],ex:"Rather than prolong the dispute, the committee chose to acquiesce to the chairman's proposal."},
{w:"Disseminate",k:"퍼뜨리다",p:"/dɪˈsemɪneɪt/",lv:"고급",syn:["Spread","Distribute"],ant:["Collect"],sim:["Circulate","Propagate"],ex:"Universities play a crucial role in disseminating knowledge and advancing public understanding."},
{w:"Erratic",k:"불규칙한",p:"/ɪˈrætɪk/",lv:"중급",syn:["Unpredictable","Inconsistent"],ant:["Consistent"],sim:["Capricious","Mercurial"],ex:"The patient's erratic behavior and mood swings raised serious concerns among the medical team."},
{w:"Precarious",k:"불안정한",p:"/prɪˈkeəriəs/",lv:"고급",syn:["Unstable","Risky"],ant:["Safe","Secure"],sim:["Perilous","Hazardous"],ex:"Millions of workers around the world live in precarious employment with no job security."},
{w:"Repercussion",k:"반향, 영향",p:"/ˌriːpərˈkʌʃən/",lv:"중급",syn:["Consequence","Effect"],ant:["Cause"],sim:["Ramification","Aftermath"],ex:"The policy change had widespread repercussions for businesses operating in the affected region."},
{w:"Indispensable",k:"필수불가결한",p:"/ˌɪndɪˈspensəbl/",lv:"중급",syn:["Essential","Vital"],ant:["Dispensable"],sim:["Crucial","Imperative"],ex:"Clean drinking water is indispensable for human survival, public health, and social development."},
{w:"Cumbersome",k:"다루기 힘든",p:"/ˈkʌmbərsəm/",lv:"고급",syn:["Awkward","Unwieldy"],ant:["Convenient"],sim:["Burdensome","Clunky"],ex:"The cumbersome application process discouraged many eligible small businesses from seeking support."},
{w:"Galvanize",k:"자극하다",p:"/ˈɡælvənaɪz/",lv:"고급",syn:["Stimulate","Motivate"],ant:["Discourage"],sim:["Energize","Spur"],ex:"The powerful documentary served to galvanize widespread public support for environmental reform."},
{w:"Circumvent",k:"우회하다",p:"/ˌsɜːrkəmˈvent/",lv:"고급",syn:["Bypass","Avoid"],ant:["Confront"],sim:["Evade","Sidestep"],ex:"Some multinational companies attempt to circumvent tax obligations through complex offshore structures."},
{w:"Contentious",k:"논쟁적인",p:"/kənˈtenʃəs/",lv:"중급",syn:["Controversial","Disputed"],ant:["Uncontroversial"],sim:["Divisive","Debatable"],ex:"Immigration policy remains one of the most contentious political issues in many democracies."},
{w:"Ramification",k:"파급효과",p:"/ˌræmɪfɪˈkeɪʃən/",lv:"고급",syn:["Consequence","Implication"],ant:[],sim:["Repercussion","Outcome"],ex:"The researchers explored the broader ramifications of widespread antibiotic resistance for public health."},
{w:"Exemplify",k:"예시하다",p:"/ɪɡˈzemplɪfaɪ/",lv:"중급",syn:["Illustrate","Demonstrate"],ant:[],sim:["Represent","Typify"],ex:"This case study exemplifies how targeted government investment can drive economic development."},
{w:"Juxtapose",k:"나란히 놓다",p:"/ˌdʒʌkstəˈpoʊz/",lv:"고급",syn:["Compare","Contrast"],ant:[],sim:["Place side by side","Set against"],ex:"The documentary juxtaposes scenes of extreme luxury and poverty to highlight global inequality."},
{w:"Encompass",k:"포함하다",p:"/ɪnˈkʌmpəs/",lv:"중급",syn:["Include","Contain"],ant:["Exclude"],sim:["Cover","Embrace"],ex:"The new legislation encompasses a wide range of provisions to improve workplace safety standards."},
{w:"Diminish",k:"줄다",p:"/dɪˈmɪnɪʃ/",lv:"중급",syn:["Reduce","Decrease"],ant:["Increase"],sim:["Lessen","Wane"],ex:"Effective public health campaigns can significantly diminish the spread of preventable diseases."},
{w:"Skeptical",k:"회의적인",p:"/ˈskeptɪkl/",lv:"중급",syn:["Doubtful","Questioning"],ant:["Trusting"],sim:["Cynical","Incredulous"],ex:"Many economists were skeptical about the government's optimistic economic growth projections."},
{w:"Watershed",k:"분수령",p:"/ˈwɔːtərʃed/",lv:"고급",syn:["Turning point","Milestone"],ant:[],sim:["Landmark","Pivotal moment"],ex:"The discovery of penicillin marked a watershed moment in the history of modern medicine."},
{w:"Zealous",k:"열정적인",p:"/ˈzeləs/",lv:"중급",syn:["Passionate","Eager"],ant:["Apathetic"],sim:["Fervent","Ardent"],ex:"The zealous advocate spent decades tirelessly fighting for the rights of marginalized workers."},
{w:"Brevity",k:"간결함",p:"/ˈbrevəti/",lv:"고급",syn:["Conciseness","Shortness"],ant:["Verbosity"],sim:["Terseness","Pithiness"],ex:"The report was widely praised for its brevity and clarity, conveying complex ideas efficiently."},
{w:"Culminate",k:"절정에 달하다",p:"/ˈkʌlmɪneɪt/",lv:"고급",syn:["Climax","Peak"],ant:["Begin"],sim:["Conclude","Result in"],ex:"Years of dedicated research ultimately culminated in a landmark paper published in a top journal."},
];

// ═══ READING PASSAGES WITH 20 QUESTIONS EACH ═══
const READING_DATA=[
{title:"The Impact of Urbanization on Modern Society",
text:"Rapid urbanization has transformed cities worldwide, bringing both remarkable opportunities and formidable challenges. Urban areas now serve as engines of economic growth, offering superior access to education, healthcare, and employment. However, this migration has intensified housing shortages, environmental degradation, and social inequality. Studies project that by 2050, approximately 68% of the global population will inhabit urban areas, placing immense pressure on infrastructure and natural resources. Policymakers must strike a delicate balance between fostering economic development and ensuring sustainable urban planning. Smart city technologies, including IoT sensors and data analytics, offer promising solutions for managing resources more efficiently. Yet the digital divide threatens to exclude the most vulnerable populations from these benefits. Community engagement remains essential for creating cities that serve all residents equitably.",
qs:[
{q:"What is the central theme of this passage?",o:["Rural development","Urbanization's dual impact","Historical architecture","Space colonization"],a:1},
{q:"What percentage will live in urban areas by 2050?",o:["48%","58%","68%","78%"],a:2},
{q:"'Formidable' is closest in meaning to:",o:["Simple","Impressive but daunting","Unnecessary","Invisible"],a:1},
{q:"What must policymakers balance?",o:["Sports and education","Development and sustainability","Agriculture and mining","Tourism and industry"],a:1},
{q:"Which is NOT mentioned as an urban challenge?",o:["Housing shortages","Environmental degradation","Lack of technology","Social inequality"],a:2},
{q:"What do smart city technologies use?",o:["Manual labor only","IoT sensors and data analytics","Traditional methods","Paper records"],a:1},
{q:"What threatens vulnerable populations?",o:["Too much technology","The digital divide","Natural disasters","Lack of food"],a:1},
{q:"The word 'equitably' means:",o:["Quickly","Fairly","Cheaply","Secretly"],a:1},
{q:"What remains essential for good cities?",o:["High taxes","Community engagement","Military presence","Corporate control"],a:1},
{q:"The author's tone is best described as:",o:["Humorous","Analytical and balanced","Angry","Fictional"],a:1},
{q:"According to the passage, cities are described as:",o:["Engines of economic growth","Centers of decline","Agricultural hubs","Military bases"],a:0},
{q:"What does 'intensified' suggest about urban problems?",o:["They decreased","They got worse","They stayed the same","They disappeared"],a:1},
{q:"The passage implies that urban planning should be:",o:["Ignored","Sustainable","Focused only on profit","Left to chance"],a:1},
{q:"IoT stands for:",o:["Internet of Things","Institute of Technology","International Trade","Information on Timing"],a:0},
{q:"What is the main risk of the digital divide?",o:["Too many smartphones","Exclusion of vulnerable groups","Faster internet","Better education"],a:1},
{q:"The passage structure can be described as:",o:["Narrative story","Problem-solution analysis","Chronological history","Personal memoir"],a:1},
{q:"Which word could replace 'delicate' in 'delicate balance'?",o:["Strong","Careful","Heavy","Obvious"],a:1},
{q:"The passage suggests that urbanization is:",o:["Entirely negative","Entirely positive","Complex with trade-offs","Irrelevant"],a:2},
{q:"Data analytics helps cities by:",o:["Reducing population","Managing resources efficiently","Eliminating poverty","Replacing workers"],a:1},
{q:"The main purpose of this passage is to:",o:["Entertain readers","Inform about urbanization challenges","Promote a political party","Sell technology"],a:1},
]},
{title:"Renewable Energy and the Global Economy",
text:"The transition to renewable energy represents one of the most significant economic shifts of the 21st century. Solar and wind power have achieved remarkable cost reductions, with solar panel costs declining by over 90% in the past decade. This has made renewables competitive with fossil fuels in many markets. Nevertheless, substantial obstacles persist in energy storage, grid modernization, and retraining workers from conventional energy sectors. Governments and enterprises must collaborate to accelerate this transition while ensuring economic benefits are distributed equitably. Battery technology breakthroughs, particularly in solid-state batteries, could resolve many storage challenges within the next decade. Meanwhile, offshore wind farms are opening new frontiers for clean energy generation in coastal nations. The geopolitical implications of this energy shift are profound, potentially reducing conflicts driven by fossil fuel dependency.",
qs:[
{q:"What has happened to solar panel costs?",o:["Increased by 90%","Decreased by over 90%","Remained stable","Decreased by 50%"],a:1},
{q:"What challenge remains for renewable energy?",o:["Lack of sunlight","Energy storage","Too much wind","Excessive funding"],a:1},
{q:"'Equitably' most likely means:",o:["Quickly","Fairly","Cheaply","Slowly"],a:1},
{q:"Who must collaborate according to the passage?",o:["Students and teachers","Governments and enterprises","Farmers only","Scientists only"],a:1},
{q:"The author's overall tone is:",o:["Pessimistic","Cautiously optimistic","Humorous","Angry"],a:1},
{q:"What type of battery could resolve storage issues?",o:["Lead-acid","Solid-state","Alkaline","Lithium only"],a:1},
{q:"Where are new wind farms being built?",o:["Deserts only","Offshore coastal areas","Mountains","Underground"],a:1},
{q:"The energy shift could reduce:",o:["Education funding","Conflicts from fossil fuel dependency","Renewable energy","Population growth"],a:1},
{q:"What happened to fossil fuels' competitiveness?",o:["They became cheaper","Renewables became competitive with them","They disappeared","No change"],a:1},
{q:"What is a 'grid' in this context?",o:["A cooking tool","Electrical distribution network","A type of battery","A solar panel"],a:1},
{q:"The passage mentions retraining for:",o:["Teachers","Conventional energy workers","Doctors","Students"],a:1},
{q:"'Substantial' is closest to:",o:["Small","Significant","Invisible","Temporary"],a:1},
{q:"What makes this an 'economic shift'?",o:["It only affects politics","It changes how energy is produced and sold","It has no financial impact","It only affects one country"],a:1},
{q:"Offshore wind farms benefit which nations?",o:["Landlocked countries","Coastal nations","Desert nations","Arctic nations"],a:1},
{q:"The word 'profound' means:",o:["Shallow","Deep and significant","Temporary","Simple"],a:1},
{q:"What is a geopolitical implication?",o:["A type of energy","Effect on international relations","A battery brand","A scientific theory"],a:1},
{q:"The passage suggests the transition is:",o:["Already complete","Still in progress with challenges","Impossible","Unimportant"],a:1},
{q:"Cost reductions in solar are described as:",o:["Minor","Remarkable","Insignificant","Problematic"],a:1},
{q:"'Accelerate' means to:",o:["Slow down","Speed up","Stop","Reverse"],a:1},
{q:"The main argument of the passage is:",o:["Fossil fuels are better","Renewables are promising but face challenges","Energy doesn't matter","Technology is dangerous"],a:1},
]},
{title:"The Psychology of Effective Learning",
text:"Contemporary research in cognitive psychology has fundamentally altered our understanding of how humans acquire and retain knowledge. Techniques such as spaced repetition, active recall, and interleaving have demonstrated significantly superior outcomes compared to traditional methods. Passive re-reading and cramming have been shown to produce only superficial learning. Educational institutions are gradually incorporating these evidence-based strategies, though adoption remains slow due to ingrained habits and institutional resistance. Neuroscience research reveals that sleep plays a crucial role in memory consolidation, with the brain actively organizing and strengthening neural connections during rest. Furthermore, the testing effect shows that retrieval practice is not merely an assessment tool but a powerful learning strategy in itself. Metacognition, the ability to think about one's own thinking, has emerged as a key predictor of academic success across all age groups.",
qs:[
{q:"Which technique involves alternating topics?",o:["Cramming","Passive reading","Interleaving","Memorization"],a:2},
{q:"What does cramming produce?",o:["Deep learning","Superficial learning","Perfect scores","Long-term memory"],a:1},
{q:"Why is adoption of new methods slow?",o:["Too expensive","Ingrained habits and resistance","Students refuse","No research exists"],a:1},
{q:"'Ingrained' means:",o:["New","Deeply established","Temporary","Foreign"],a:1},
{q:"The main purpose is to:",o:["Criticize students","Explain learning research","Promote a school","Discuss politics"],a:1},
{q:"What role does sleep play in learning?",o:["No role","Memory consolidation","Forgetting","Entertainment"],a:1},
{q:"The testing effect suggests that tests are:",o:["Only for assessment","Also a learning strategy","Harmful","Unnecessary"],a:1},
{q:"Metacognition is:",o:["Reading slowly","Thinking about your own thinking","A type of exam","A brain disease"],a:1},
{q:"'Superficial' learning means:",o:["Deep understanding","Surface-level only","Perfect recall","Permanent"],a:1},
{q:"Active recall involves:",o:["Passive reading","Retrieving information from memory","Watching videos","Sleeping more"],a:1},
{q:"Spaced repetition means:",o:["Studying everything at once","Reviewing at increasing intervals","Never reviewing","Random studying"],a:1},
{q:"Neural connections are strengthened during:",o:["Exercise","Sleep","Eating","Cramming"],a:1},
{q:"Evidence-based strategies are based on:",o:["Opinions","Scientific research","Tradition","Guessing"],a:1},
{q:"The passage suggests traditional methods are:",o:["The best approach","Less effective than modern techniques","Impossible to use","Not mentioned"],a:1},
{q:"'Consolidation' means:",o:["Destruction","Strengthening and organizing","Forgetting","Separating"],a:1},
{q:"Which is most important for academic success?",o:["Wealth","Metacognition","Physical strength","Social media"],a:1},
{q:"'Contemporary' means:",o:["Ancient","Modern/current","Future","Historical"],a:1},
{q:"The passage implies that learning research is:",o:["Complete","Still evolving","Unreliable","Simple"],a:1},
{q:"Retrieval practice is a form of:",o:["Passive learning","Active learning","Entertainment","Relaxation"],a:1},
{q:"Institutional resistance refers to:",o:["Building construction","Organizations' reluctance to change","Student protests","Government laws"],a:1},
]},
];

// ═══ LISTENING DATA ═══
const LISTEN_DATA=[
{title:"University Lecture: Environmental Science",ctx:"A professor explains deforestation's impact on tropical water cycles and biodiversity.",
sample:"Today we'll examine the cascading effects of deforestation on tropical ecosystems. When large areas of forest are cleared, the local water cycle is fundamentally disrupted. Trees act as natural water pumps, drawing moisture from the soil and releasing it through transpiration. Without this process, rainfall patterns shift dramatically, often leading to prolonged dry periods. The loss of canopy cover also increases soil erosion and reduces the habitat available for countless species. Recent satellite data shows that deforestation rates have accelerated in several key regions, particularly in Southeast Asia and South America.",
qs:[
{q:"What is the main topic?",o:["Marine biology","Deforestation and water cycles","Space exploration","Urban planning"],a:1},
{q:"Trees act as natural:",o:["Filters","Water pumps","Heaters","Shields"],a:1},
{q:"Transpiration releases what into the atmosphere?",o:["Carbon dioxide","Moisture","Oxygen only","Heat"],a:1},
{q:"Deforestation leads to:",o:["More rainfall","Prolonged dry periods","Colder temperatures","More forests"],a:1},
{q:"Canopy loss increases:",o:["Biodiversity","Soil erosion","Rainfall","Forest growth"],a:1},
{q:"Which regions are most affected?",o:["Europe and Africa","Southeast Asia and South America","North America","Antarctica"],a:1},
{q:"'Cascading effects' means:",o:["Small isolated changes","Chain reaction of consequences","No effects","Random events"],a:1},
{q:"What data source is mentioned?",o:["Books","Satellite data","Interviews","Newspapers"],a:1},
{q:"The lecture's tone is:",o:["Casual","Academic and informative","Humorous","Emotional"],a:1},
{q:"What should listeners focus on?",o:["The professor's appearance","Key facts and cause-effect relationships","Entertainment value","Personal opinions"],a:1},
{q:"'Accelerated' means:",o:["Slowed down","Sped up","Stopped","Reversed"],a:1},
{q:"The best note-taking strategy would be:",o:["Write everything","Use keywords and diagrams","Don't take notes","Only write dates"],a:1},
{q:"If asked about the main idea, the answer relates to:",o:["Economics","Environmental impact of deforestation","Politics","Technology"],a:1},
{q:"Habitat reduction affects:",o:["Only trees","Countless species","Only birds","Only insects"],a:1},
{q:"The lecture format is:",o:["Interview","Monologue/presentation","Debate","Conversation"],a:1},
{q:"What type of listening is tested here?",o:["For entertainment","For gist and detail","For attitude only","For numbers only"],a:1},
{q:"A common exam trap here would be:",o:["Correct answer too obvious","Distractor using similar but wrong details","No traps exist","All answers correct"],a:1},
{q:"After hearing 'fundamentally,' the speaker means:",o:["Slightly","At a basic/core level","Temporarily","Possibly"],a:1},
{q:"Soil erosion is caused by:",o:["Too much rain","Loss of tree root systems and canopy","Earthquakes","Human digging"],a:1},
{q:"The purpose of mentioning satellite data is to:",o:["Show off technology","Provide evidence for claims","Change the topic","Entertain"],a:1},
]},
{title:"Career Development Workshop: Interview Skills",ctx:"A career counselor provides guidance on preparing for job interviews and professional communication.",
sample:"Welcome to today's career development workshop. A successful job interview requires thorough preparation and clear communication. First, research the company before your interview — study their mission, recent achievements, and industry position. Second, prepare specific examples using the STAR method: Situation, Task, Action, and Result. This approach helps you give structured, memorable answers. Third, practice your responses aloud to reduce filler words such as um and uh, and to build natural confidence. Dress professionally and arrive ten to fifteen minutes early to make a positive first impression. During the interview, listen carefully to each question and take a brief moment to organize your thoughts before responding. Ask thoughtful questions about the role and company culture, because interviews are two-way conversations. Remember, you are also evaluating whether the company aligns with your professional goals. Finally, send a brief thank-you email within twenty-four hours of the interview to reinforce your interest and leave a lasting impression.",
qs:[
{q:"What is the main purpose of this workshop?",o:["Learning to write resumes","Preparing for job interviews","Improving writing skills","Networking strategies"],a:1},
{q:"What does STAR stand for?",o:["Study, Test, Achieve, Reflect","Situation, Task, Action, Result","Speak, Think, Adapt, React","Skill, Training, Application, Result"],a:1},
{q:"How early should you arrive for an interview?",o:["30 minutes early","Exactly on time","10–15 minutes early","5 minutes early"],a:2},
{q:"What should you research before an interview?",o:["The interviewer's personal life","The company's mission and achievements","Other candidates","Salary data only"],a:1},
{q:"What reduces filler words like 'um' and 'uh'?",o:["Speaking faster","Practicing aloud","Writing more","Memorizing a script"],a:1},
{q:"The STAR method is used for:",o:["Evaluating companies","Structuring interview answers","Writing resumes","Negotiating salary"],a:1},
{q:"Interviews are described as:",o:["One-way assessments","Two-way conversations","Group activities","Online-only events"],a:1},
{q:"What should you send within 24 hours after an interview?",o:["A resume","A thank-you email","A formal complaint","A follow-up call"],a:1},
{q:"Asking thoughtful questions during the interview shows:",o:["Lack of preparation","Nervousness","Genuine interest","Overconfidence"],a:2},
{q:"'Aligns with' most nearly means:",o:["Conflicts with","Matches or fits","Replaces","Contradicts"],a:1},
{q:"What type of questions should you ask the interviewer?",o:["Personal questions","Salary questions immediately","Thoughtful questions about the role","Questions about other candidates"],a:2},
{q:"The word 'reinforce' in the passage means:",o:["Weaken","Remove","Strengthen","Question"],a:2},
{q:"What helps make a positive first impression?",o:["Arriving exactly on time","Dressing casually","Arriving early and dressing professionally","Speaking loudly"],a:2},
{q:"The STAR method improves answers by making them:",o:["Longer and detailed","Structured and memorable","Shorter and vague","More emotional"],a:1},
{q:"Why should you evaluate the company too?",o:["To negotiate better pay","To ensure the role matches your goals","To impress the interviewer","To prepare harder questions"],a:1},
{q:"'Thorough preparation' means:",o:["Quick review","Preparing in great detail","Guessing answers","Avoiding the topic"],a:1},
{q:"The tone of this workshop is:",o:["Humorous","Practical and instructional","Formal and academic","Critical"],a:1},
{q:"Which is NOT mentioned as interview advice?",o:["Using the STAR method","Researching the company","Sending a thank-you email","Bringing printed references"],a:3},
{q:"'Filler words' refer to:",o:["Technical vocabulary","Meaningless sounds like 'um' used while thinking","Key action words","Academic jargon"],a:1},
{q:"What is the overall message of this workshop?",o:["Avoid interviews if possible","Careful preparation leads to success","Focus only on qualifications","Interviews are unimportant"],a:1},
]},
{title:"Technology Lecture: Artificial Intelligence and Society",ctx:"A university professor examines how artificial intelligence is reshaping industries and raising ethical questions.",
sample:"Today's lecture focuses on artificial intelligence and its growing influence across society. Machine learning algorithms can now analyze vast datasets and identify patterns that would take human researchers years to discover. In healthcare, AI systems are achieving diagnostic accuracy that rivals experienced physicians in detecting certain types of cancer from medical imaging. Financial institutions use predictive algorithms to assess credit risks and detect fraudulent transactions in real time. However, AI presents significant ethical challenges. Algorithmic bias can perpetuate discrimination when training data reflects historical inequalities. For example, facial recognition systems have shown lower accuracy rates for certain demographic groups. The displacement of workers through automation raises serious concerns about economic inequality and the urgent need for workforce reskilling programs. Experts continue to debate whether artificial general intelligence — which could theoretically match human cognitive abilities across all domains — will emerge within the coming decades. Meanwhile, transparent and accountable AI governance frameworks are essential to ensure these powerful technologies serve the common good.",
qs:[
{q:"What is the main topic of this lecture?",o:["Robotics engineering","AI and its societal impact","Computer programming","Internet history"],a:1},
{q:"What can machine learning algorithms do?",o:["Replace all human jobs immediately","Analyze vast datasets and find patterns","Create art and music only","Predict the weather accurately"],a:1},
{q:"In healthcare, AI rivals physicians in:",o:["Surgery","Detecting cancer from medical imaging","Prescribing medication","Patient communication"],a:1},
{q:"What do financial institutions use AI for?",o:["Customer service only","Assessing credit risk and detecting fraud","Replacing accountants","Managing physical cash"],a:1},
{q:"What is algorithmic bias?",o:["A programming error","AI discrimination caused by biased training data","A hardware malfunction","Slow algorithm speed"],a:1},
{q:"Facial recognition shows lower accuracy for:",o:["Elderly people only","Certain demographic groups","Children under ten","Men in general"],a:1},
{q:"What major concern does automation raise?",o:["Too much productivity","Economic inequality and job displacement","Environmental pollution","Overuse of electricity"],a:1},
{q:"What does 'reskilling' mean?",o:["Retiring workers early","Learning new skills for different jobs","Outsourcing work overseas","Hiring more robots"],a:1},
{q:"What is artificial general intelligence?",o:["A specific robot model","AI that can match human cognition across all areas","A medical diagnosis tool","The AI we currently use daily"],a:1},
{q:"'Perpetuate' most closely means:",o:["End","Continue or sustain","Discover","Remove"],a:1},
{q:"Fraud detection by AI happens:",o:["Weekly","In real time","Yearly","After manual review"],a:1},
{q:"What is needed to ensure AI serves the public good?",o:["Fewer regulations","Transparent and accountable governance frameworks","Unlimited corporate control","Slower development"],a:1},
{q:"'Vast datasets' refers to:",o:["Small data files","Extremely large amounts of data","Classified government records","Medical records only"],a:1},
{q:"The lecture's overall tone is:",o:["Strictly positive about AI","Strictly negative about AI","Balanced, noting both benefits and challenges","Humorous and informal"],a:2},
{q:"The word 'displace' in the lecture means:",o:["Improve working conditions","Replace or remove from a position","Train workers","Hire more employees"],a:1},
{q:"Which sector is NOT mentioned in the lecture?",o:["Healthcare","Finance","Agriculture","Technology governance"],a:2},
{q:"Why is training data important for AI?",o:["It determines internet speed","It shapes what AI learns and can introduce bias","It controls energy usage","It stores all user information"],a:1},
{q:"'Diagnostic accuracy' refers to:",o:["Speed of data processing","Correctness of medical diagnoses","Cost of medical treatment","Patient satisfaction levels"],a:1},
{q:"The pattern-finding ability of AI is compared to:",o:["Searching a library","Years of human research","Writing a textbook","Teaching in a classroom"],a:1},
{q:"What is the key takeaway from this lecture?",o:["AI should be banned","AI is only useful in healthcare","AI offers benefits but requires careful ethical oversight","AI will replace all professors"],a:2},
]},
];

// ═══ SPEAKING DATA ═══
const SPEAK_DATA=[
{topic:"Describe a technological innovation that has significantly changed people's daily lives. Explain how it works and discuss its impact on society.",
follow:["Do you think technology makes people more connected or isolated?","What technology will be most important in the next decade?","Should governments regulate new technologies more strictly?"],
ielts:"IELTS Part 2: 1 minute preparation, speak for 1-2 minutes. Part 3 follow-ups test abstract thinking.",
pte:"PTE: Speak for 60-90 seconds. Fluency, pronunciation, and content are key scoring criteria."},
{topic:"Talk about an educational experience that changed your perspective. What happened, why was it significant, and how did it affect your future decisions?",
follow:["How has education changed compared to previous generations?","Can online education replace traditional schooling?","What makes a teacher truly effective?"],
ielts:"IELTS Part 2: Include specific details — when, where, who was involved, how you felt.",
pte:"PTE: Focus on clear pronunciation, natural pacing, and organized content."},
{topic:"Describe an environmental issue that concerns you. What causes it, what effects does it have, and what solutions would you propose?",
follow:["Should environmental protection take priority over economic development?","How can individuals contribute to solving environmental problems?","Will future generations face worse environmental challenges?"],
ielts:"IELTS Part 3: Be prepared for abstract discussion. Use conditional structures.",
pte:"PTE: Use a range of vocabulary and complex sentence structures for higher scores."},
{topic:"Talk about a time when you had to adapt to a significant change in your life. How did you handle it and what did you learn from the experience?",
follow:["Why do some people adapt to change more easily?","Is change generally positive or negative for society?","How should organizations help people adapt to changes?"],
ielts:"IELTS: Use past tenses accurately. Include feelings and reflections.",
pte:"PTE: Maintain consistent volume and pace. Avoid long pauses."},
{topic:"Describe a public space in your city that you enjoy visiting. What makes it special, how do people use it, and why is it important to the community?",
follow:["How important are public spaces for community well-being?","Should cities prioritize green spaces over commercial development?","How have public spaces changed over the past few decades?"],
ielts:"IELTS Part 2: Use sensory language — what you see, hear, feel, smell.",
pte:"PTE: Demonstrate vocabulary range with descriptive adjectives and adverbs."},
{topic:"Discuss a skill that everyone should learn in the modern world. Why is it important, how can people develop it, and what impact would it have on society?",
follow:["Should schools teach more practical life skills?","How has the importance of different skills changed over time?","Can critical thinking be taught or is it innate?"],
ielts:"IELTS: Give concrete examples to support opinions. Use discourse markers.",
pte:"PTE: Use connectors like 'firstly,' 'moreover,' 'in conclusion' for coherence."},
{topic:"Describe a book, documentary, or film that taught you something valuable. What was the main message and how did it influence your thinking or behavior?",
follow:["Can media be an effective educational tool?","How do books and films shape public opinion?","Should there be limits on what media can portray?"],
ielts:"IELTS: Demonstrate vocabulary related to arts, culture, and media.",
pte:"PTE: Aim for natural rhythm — avoid speaking too fast or monotonously."},
];

// ═══ WRITING TASKS ═══
const WRITE_IELTS=[
{type:"Task 2 — Opinion Essay",prompt:"Some people believe that universities should focus on academic knowledge, while others think they should prepare students for employment. Discuss both views and give your own opinion.",target:250},
{type:"Task 1 — Report",prompt:"The bar chart shows the percentage of adults who exercised regularly in five countries between 2000 and 2020. Summarize the information by selecting and reporting the main features.",target:150},
{type:"Task 2 — Discussion",prompt:"The gap between the rich and the poor is widening in many countries. What problems does this cause and what measures can governments take?",target:250},
{type:"Task 2 — Agree/Disagree",prompt:"International tourism has brought enormous benefits but also concerns about its impact on local communities and the environment. Do the disadvantages outweigh the advantages?",target:250},
{type:"Task 2 — Problem/Solution",prompt:"Traffic congestion is becoming a major problem in many cities. What are the main causes and what solutions can be implemented?",target:250},
{type:"Task 2 — Two-Part",prompt:"Many young people today delay having children. Why is this happening and is it a positive or negative development?",target:250},
{type:"Task 1 — Letter",prompt:"You purchased a defective electronic device online. Write a letter describing what you bought, the problems experienced, and what action you want the company to take.",target:150},
];
const WRITE_PTE=[
{type:"Write Essay",prompt:"Governments should invest more in scientific research than in arts and culture. To what extent do you agree or disagree?",target:300},
{type:"Summarize Written Text",prompt:"Summarize in ONE sentence (5-75 words): 'AI has created new possibilities across industries. In healthcare, AI diagnoses diseases more accurately. In finance, algorithms predict trends. However, concerns about job displacement and ethics continue to grow.'",target:50},
{type:"Write Essay",prompt:"Climate change requires global cooperation, yet countries prioritize national interests. Discuss challenges of international climate agreements and propose solutions.",target:300},
{type:"Write Essay",prompt:"Examinations may not effectively assess student ability. Discuss advantages and disadvantages of exams as assessment.",target:300},
{type:"Write Essay",prompt:"Social media has fundamentally changed interpersonal relationships. Discuss both positive and negative effects.",target:300},
{type:"Write Essay",prompt:"Genetic engineering in agriculture may be necessary to feed the growing population, but it poses risks. Discuss both sides.",target:300},
{type:"Summarize Written Text",prompt:"Summarize in ONE sentence (5-75 words): 'Remote work has transformed workplaces. Companies adopted flexible schedules and virtual tools. Productivity remained stable, but isolation and maintaining culture emerged as concerns.'",target:50},
];

// ═══ GRAMMAR CHECKER ═══
const GRAMMAR=[
{re:/\bi\b(?![''])/g,fix:"I",rule:"Capitalize pronoun 'I'"},
{re:/\b(dont|doesnt|didnt|isnt|wasnt|werent|arent|cant|wont|shouldnt|couldnt|wouldnt|hasnt|havent|hadnt)\b/gi,fix:m=>({"dont":"don't","doesnt":"doesn't","didnt":"didn't","isnt":"isn't","wasnt":"wasn't","werent":"weren't","arent":"aren't","cant":"can't","wont":"won't","shouldnt":"shouldn't","couldnt":"couldn't","wouldnt":"wouldn't","hasnt":"hasn't","havent":"haven't","hadnt":"hadn't"})[m.toLowerCase()]||m,rule:"Use apostrophe in contractions"},
{re:/\b(alot)\b/gi,fix:"a lot",rule:"'A lot' is two words"},
{re:/\b(definately|definatly)\b/gi,fix:"definitely",rule:"Spelling: definitely"},
{re:/\b(recieve)\b/gi,fix:"receive",rule:"Spelling: receive (i before e after c)"},
{re:/\b(occured)\b/gi,fix:"occurred",rule:"Spelling: occurred (double r)"},
{re:/\b(seperate)\b/gi,fix:"separate",rule:"Spelling: separate"},
{re:/\b(goverment)\b/gi,fix:"government",rule:"Spelling: government"},
{re:/\b(enviroment)\b/gi,fix:"environment",rule:"Spelling: environment"},
{re:/\b(becuase|becasue)\b/gi,fix:"because",rule:"Spelling: because"},
{re:/\b(thier)\b/gi,fix:"their",rule:"Spelling: their"},
{re:/\b(wich)\b/gi,fix:"which",rule:"Spelling: which"},
{re:/\.\s+[a-z]/g,fix:m=>". "+m.trim().slice(-1).toUpperCase(),rule:"Capitalize after period"},
{re:/\b(alright)\b/gi,fix:"all right",rule:"Spelling: 'all right' (two words in formal writing)"},
{re:/\b(irregardless)\b/gi,fix:"regardless",rule:"Use 'regardless,' not 'irregardless'"},
{re:/\bcould of\b/gi,fix:"could have",rule:"Use 'could have,' not 'could of'"},
{re:/\bwould of\b/gi,fix:"would have",rule:"Use 'would have,' not 'would of'"},
{re:/\bshould of\b/gi,fix:"should have",rule:"Use 'should have,' not 'should of'"},
{re:/\bmust of\b/gi,fix:"must have",rule:"Use 'must have,' not 'must of'"},
{re:/\b(atleast)\b/gi,fix:"at least",rule:"'At least' is two words"},
{re:/\b(noone)\b/gi,fix:"no one",rule:"'No one' is two words"},
{re:/\b(eachother)\b/gi,fix:"each other",rule:"'Each other' is two words"},
{re:/\b(incase)\b/gi,fix:"in case",rule:"'In case' is two words"},
{re:/\b(wellbeing)\b/gi,fix:"well-being",rule:"Hyphenate: 'well-being'"},
{re:/\b(gonna|wanna|gotta)\b/gi,fix:m=>({"gonna":"going to","wanna":"want to","gotta":"have to"})[m.toLowerCase()]||m,rule:"Use formal forms in academic writing"},
];

function checkWriting(text){
  if(!text.trim())return{corrections:[],score:0,feedback:[],wc:0,sc:0,avg:0};
  const words=text.trim().split(/\s+/);const wc=words.length;
  const sents=text.split(/[.!?]+/).filter(s=>s.trim());const sc=sents.length;
  const avg=sc?Math.round(wc/sc):0;
  const corrections=[];
  GRAMMAR.forEach(g=>{let m;const rx=new RegExp(g.re.source,g.re.flags);while((m=rx.exec(text))!==null){const f=typeof g.fix==="function"?g.fix(m[0]):g.fix;if(f!==m[0])corrections.push({orig:m[0],fix:f,rule:g.rule,idx:m.index})}});
  const feedback=[];
  if(avg>25)feedback.push({t:"warn",msg:"문장이 너무 깁니다 (평균 "+avg+"단어). 15-20단어가 이상적입니다.",tip:"Break long sentences using periods or semicolons."});
  if(avg<8&&sc>2)feedback.push({t:"warn",msg:"문장이 너무 짧습니다. 복잡한 구조를 사용해보세요.",tip:"Combine with 'although,' 'while,' or 'because.'"});
  const conn=["however","moreover","furthermore","in addition","nevertheless","consequently","therefore","on the other hand","in contrast","similarly"];
  const used=conn.filter(c=>text.toLowerCase().includes(c));
  if(used.length===0&&wc>50)feedback.push({t:"up",msg:"연결어(linking words)를 사용하면 글의 흐름이 좋아집니다.",tip:"Add 'However,' 'Moreover,' 'Furthermore,' 'In addition.'"});
  if(used.length>=3)feedback.push({t:"ok",msg:"연결어를 잘 사용하고 있습니다: "+used.join(", ")});
  const paras=text.split(/\n\n+/).filter(p=>p.trim());
  if(paras.length<2&&wc>100)feedback.push({t:"up",msg:"단락을 나눠서 구조를 명확히 하세요.",tip:"Intro → Body 1 → Body 2 → Conclusion"});
  if(paras.length>=3)feedback.push({t:"ok",msg:"단락 구성이 잘 되어 있습니다."});
  const uniq=new Set(words.map(w=>w.toLowerCase().replace(/[^a-z]/g,"")).filter(Boolean));
  const lex=uniq.size/Math.max(wc,1);
  if(lex<0.4&&wc>30)feedback.push({t:"up",msg:"어휘 다양성을 높여보세요.",tip:"Replace 'good'→'beneficial,' 'important'→'crucial.'"});
  if(lex>0.6)feedback.push({t:"ok",msg:"어휘 다양성이 우수합니다!"});
  const score=Math.min(9,Math.max(3,Math.round((used.length*0.8+Math.min(paras.length,4)*0.7+lex*6+Math.min(wc/30,3)-corrections.length*0.3)*10)/10));
  return{corrections,score,feedback,wc,sc,avg};
}

// ═══ TTS ═══
function getVoices(){return new Promise(r=>{let v=window.speechSynthesis?.getVoices()||[];if(v.length){r(v);return;}window.speechSynthesis?.addEventListener("voiceschanged",()=>r(window.speechSynthesis.getVoices()),{once:true});setTimeout(()=>r(window.speechSynthesis?.getVoices()||[]),1000);})}
function findVoice(vs,acc){const m={us:"en-US",uk:"en-GB",au:"en-AU"};const l=m[acc]||"en-US";return vs.find(v=>v.lang===l)||vs.find(v=>v.lang.startsWith("en"))||vs[0]}
async function speak(text,acc="us"){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const vs=await getVoices();const u=new SpeechSynthesisUtterance(text);const v=findVoice(vs,acc);if(v)u.voice=v;u.rate=0.85;u.pitch=1;return new Promise(r=>{u.onend=r;u.onerror=r;window.speechSynthesis.speak(u);})}

// ═══ RECORDER HOOK ═══
function useRec(){
  const[rec,setRec]=useState(false);const[url,setUrl]=useState(null);const[tr,setTr]=useState("");
  const mr=useRef(null);const ch=useRef([]);const sr=useRef(null);
  const start=useCallback(async()=>{
    try{const s=await navigator.mediaDevices.getUserMedia({audio:true});const m=new MediaRecorder(s);ch.current=[];
    m.ondataavailable=e=>{if(e.data.size>0)ch.current.push(e.data)};
    m.onstop=()=>{setUrl(URL.createObjectURL(new Blob(ch.current,{type:"audio/webm"})));s.getTracks().forEach(t=>t.stop())};
    mr.current=m;m.start();setRec(true);setUrl(null);
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){const r=new SR();r.continuous=true;r.interimResults=false;r.lang="en-US";let ft="";
    r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)ft+=e.results[i][0].transcript+" ";setTr(ft.trim())};
    r.onerror=()=>{};r.start();sr.current=r;}
    }catch{alert("마이크 접근 권한이 필요합니다.")}
  },[]);
  const stop=useCallback(()=>{mr.current?.stop();sr.current?.stop();setRec(false)},[]);
  const reset=useCallback(()=>{setUrl(null);setTr("");setRec(false)},[]);
  return{rec,url,tr,start,stop,reset,setTr};
}

// ═══ SPEAKING ANALYZER ═══
function analyzeSpeech(text){
  if(!text.trim())return null;
  const words=text.trim().split(/\s+/);const wc=words.length;const fb=[];
  // Word count
  if(wc<30)fb.push({t:"warn",l:"분량 부족",m:"더 길게 말해보세요. 120–180단어를 목표로.",tip:"Add examples, reasons, and personal experiences to develop your response."});
  else if(wc>=120)fb.push({t:"ok",l:"충분한 분량 ✓",m:`${wc}단어 — IELTS/PTE 목표 범위 달성`});
  else if(wc>=60)fb.push({t:"warn",l:"분량 보통",m:`${wc}단어. 더 상세한 설명을 추가해보세요.`,tip:"Aim for 120–180 words for a full IELTS/PTE response."});
  // Filler words
  const fillers=["um","uh","like","you know","basically","actually","literally","i mean","so yeah"];
  const uf=fillers.filter(f=>text.toLowerCase().includes(f));
  if(uf.length)fb.push({t:"warn",l:"필러 단어 감지",m:"줄여보세요: "+uf.join(", "),tip:"Replace filler words with a brief pause. Silence is better than 'um.'"});
  else if(wc>30)fb.push({t:"ok",l:"필러 단어 없음 ✓",m:"명확하고 유창한 발화입니다."});
  // Linking words / discourse markers
  const conn=["however","moreover","furthermore","for example","for instance","on the other hand","therefore","consequently","in addition","nevertheless","firstly","secondly","finally","in conclusion"];
  const uc=conn.filter(c=>text.toLowerCase().includes(c));
  if(!uc.length&&wc>30)fb.push({t:"up",l:"연결어 부족",m:"담화 표지어를 사용해보세요.",tip:"Try: 'However,' 'Moreover,' 'For example,' 'Therefore,' 'In addition.'"});
  else if(uc.length>=3)fb.push({t:"ok",l:"연결어 사용 우수 ✓",m:"사용한 표지어: "+uc.join(", ")});
  else if(uc.length>=1)fb.push({t:"up",l:"연결어 일부 사용",m:"사용: "+uc.join(", ")+". 더 다양하게 사용해보세요.",tip:"Aim for at least 3 different discourse markers in a full response."});
  // Vocabulary diversity
  const uniq=new Set(words.map(w=>w.toLowerCase().replace(/[^a-z]/g,"")).filter(Boolean));
  const lex=uniq.size/Math.max(wc,1);
  if(lex<0.45&&wc>20)fb.push({t:"up",l:"어휘 다양성 부족",m:"같은 단어 반복을 줄여보세요.",tip:"'good'→'beneficial/outstanding,' 'bad'→'detrimental/harmful,' 'big'→'substantial/significant.'"});
  else if(lex>0.6)fb.push({t:"ok",l:"어휘 다양성 우수 ✓",m:"다양한 어휘를 효과적으로 사용하고 있습니다."});
  // Sentence variety (rough estimate via punctuation)
  const sentCount=(text.match(/[.!?]+/g)||[]).length;
  if(wc>50&&sentCount>0){const avgSentLen=Math.round(wc/sentCount);
    if(avgSentLen>30)fb.push({t:"warn",l:"문장이 너무 깁니다",m:`평균 ${avgSentLen}단어/문장. 문장을 나눠보세요.`,tip:"Use shorter sentences or connect with 'which,' 'that,' 'because.'"});
    else if(avgSentLen<5&&sentCount>3)fb.push({t:"warn",l:"문장이 너무 짧습니다",m:"더 복잡한 문장 구조를 시도해보세요.",tip:"Combine ideas using 'although,' 'while,' 'since,' or relative clauses."});
  }
  // Fixed pronunciation tip
  fb.push({t:"tip",l:"발음 & 억양 팁",m:"",tip:"• 명사·동사·형용사 강세 두어 말하기\n• 평서문은 끝을 내리고, 의문문은 올리기\n• Thought group 사이에 짧은 pause 넣기\n• /θ/(think), /ð/(this), /r/ vs /l/ 집중 연습\n• -ed 어미: /t/ (walked), /d/ (played), /ɪd/ (wanted)"});
  return{fb,wc};
}

// ═══════════════════════════════════════
// STREAK UTILITY
function calcStreak(scores){
  const today=todayStr();const dates=Object.keys(scores).sort().reverse();
  if(!dates.length)return 0;
  let streak=0;const d=new Date(today);
  for(const date of dates){
    const expected=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if(date===expected){streak++;d.setDate(d.getDate()-1);}else break;
  }
  return streak;
}

// ═══════════════════════════════════════
// MAIN APP

export {
  mulberry32,
  hashStr,
  shuffle,
  pick,
  todayStr,
  fmtDate,
  calcStreak,
  loadData,
  saveData,
  exportData,
  APP_VERSION,
  UPDATES,
  C,
  F,
  VOCAB,
  READING_DATA,
  LISTEN_DATA,
  SPEAK_DATA,
  WRITE_IELTS,
  WRITE_PTE,
  checkWriting,
  speak,
  useRec,
  analyzeSpeech,
};
