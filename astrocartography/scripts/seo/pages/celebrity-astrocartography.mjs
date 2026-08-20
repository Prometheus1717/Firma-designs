import { DEMO_CHARTS } from '../../../src/data/demoCharts.js';
import {
  CELEBRITY_LANGS,
  CELEBRITY_PROFILES,
  getCelebrityAlternates,
  getCelebrityRoute,
  getCelebritySlug,
} from '../../../src/data/celebrityRoutes.js';
import { calculateChart } from '../../../src/lib/calculateChart.js';
import { t } from '../../../src/lib/i18n.js';

const PROFILE_THEMES = {
  jackson: {
    en: 'A precise Virgo Sun meets a highly receptive Pisces Moon and Pisces Ascendant: craft, sensitivity and public projection sit side by side. Sagittarius on the Midheaven adds scale, movement and a global horizon to the vocation.',
    de: 'Eine präzise Jungfrau-Sonne trifft auf einen hoch empfänglichen Fische-Mond und Fische-Aszendenten: Handwerk, Sensibilität und öffentliche Projektion liegen eng beieinander. Schütze am MC gibt der Berufung Größe, Bewegung und einen globalen Horizont.',
    fr: 'Un Soleil précis en Vierge rencontre une Lune et un Ascendant très réceptifs en Poissons : maîtrise, sensibilité et projection publique coexistent. Le Sagittaire au Milieu du Ciel donne à la vocation ampleur, mouvement et portée mondiale.',
    it: 'Un Sole preciso in Vergine incontra Luna e Ascendente molto ricettivi in Pesci: tecnica, sensibilità e proiezione pubblica convivono. Il Sagittario al Medio Cielo dà alla vocazione ampiezza, movimento e respiro globale.',
    es: 'Un Sol preciso en Virgo se encuentra con una Luna y un Ascendente muy receptivos en Piscis: oficio, sensibilidad y proyección pública conviven. Sagitario en el Medio Cielo añade escala, movimiento y un horizonte mundial a la vocación.',
    tr: 'Başak’taki titiz Güneş, Balık’taki son derece alıcı Ay ve Yükselenle buluşur: ustalık, hassasiyet ve kamusal yansıtma yan yanadır. Tepe Noktası’ndaki Yay, mesleğe ölçek, hareket ve küresel ufuk katar.',
    ru: 'Точное Солнце в Деве сочетается с восприимчивыми Луной и Асцендентом в Рыбах: мастерство, чувствительность и публичная проекция существуют рядом. Стрелец на МС придаёт призванию масштаб, движение и мировой горизонт.',
    pt: 'Um Sol preciso em Virgem encontra Lua e Ascendente muito receptivos em Peixes: técnica, sensibilidade e projeção pública convivem. Sagitário no Meio do Céu acrescenta escala, movimento e horizonte global à vocação.',
    ja: '乙女座の緻密な太陽と、魚座の非常に繊細な月・アセンダントが重なり、技術、感受性、世間からの投影が並びます。射手座のMCは、職業にスケール、移動、世界的な視野を与えます。',
    zh: '处女座的精确太阳，与双鱼座高度敏感的月亮和上升点相遇：技艺、感受力与公众投射并存。射手座天顶让事业带有规模、流动性与全球视野。',
    ar: 'تلتقي شمس العذراء الدقيقة بقمر وطالع شديدَي الحساسية في الحوت: الحرفة والرهافة والإسقاط الجماهيري جنبًا إلى جنب. ويمنح القوس عند منتصف السماء المسار المهني اتساعًا وحركة وأفقًا عالميًا.',
    ko: '처녀자리의 정교한 태양과 물고기자리의 민감한 달·상승점이 만나 기술, 감수성, 대중의 투영이 나란히 놓입니다. 사수자리의 중천은 직업에 규모와 이동성, 세계적인 시야를 더합니다.',
    pl: 'Precyzyjne Słońce w Pannie łączy się z bardzo wrażliwym Księżycem i Ascendentem w Rybach: kunszt, czułość i publiczna projekcja stoją obok siebie. Strzelec na MC dodaje powołaniu skali, ruchu i globalnego horyzontu.',
    nl: 'Een precieze Zon in Maagd ontmoet een sterk ontvankelijke Maan en Ascendant in Vissen: vakmanschap, gevoeligheid en publieke projectie staan naast elkaar. Boogschutter op het MC geeft de roeping schaal, beweging en een wereldwijde horizon.',
  },
  musk: {
    en: 'Cancer Sun and Cancer rising emphasize instinct, protection and a powerful private core, while a Virgo Moon looks for systems that can be refined. Aries on the Midheaven makes the public path direct, competitive and pioneering.',
    de: 'Krebs-Sonne und Krebs-Aszendent betonen Instinkt, Schutz und einen starken privaten Kern, während der Jungfrau-Mond Systeme verbessern will. Widder am MC macht den öffentlichen Weg direkt, wettbewerbsorientiert und pionierhaft.',
    fr: 'Soleil et Ascendant en Cancer soulignent instinct, protection et noyau privé puissant, tandis que la Lune en Vierge cherche des systèmes à perfectionner. Le Bélier au MC rend la voie publique directe, compétitive et pionnière.',
    it: 'Sole e Ascendente in Cancro enfatizzano istinto, protezione e un forte nucleo privato; la Luna in Vergine cerca sistemi da perfezionare. L’Ariete al Medio Cielo rende il percorso pubblico diretto, competitivo e pionieristico.',
    es: 'Sol y Ascendente en Cáncer enfatizan instinto, protección y un núcleo privado fuerte; la Luna en Virgo busca sistemas que perfeccionar. Aries en el Medio Cielo vuelve la trayectoria pública directa, competitiva y pionera.',
    tr: 'Yengeç Güneş ve Yükselen içgüdü, koruma ve güçlü bir özel çekirdeği vurgular; Başak Ay geliştirilebilecek sistemler arar. Tepe Noktası’ndaki Koç kamusal yolu doğrudan, rekabetçi ve öncü kılar.',
    ru: 'Солнце и Асцендент в Раке подчёркивают инстинкт, защиту и сильное личное ядро, а Луна в Деве ищет системы для совершенствования. Овен на МС делает публичный путь прямым, конкурентным и новаторским.',
    pt: 'Sol e Ascendente em Câncer enfatizam instinto, proteção e um núcleo privado forte; a Lua em Virgem procura sistemas para aperfeiçoar. Áries no Meio do Céu torna a trajetória pública direta, competitiva e pioneira.',
    ja: '蟹座の太陽と上昇点は本能、保護、強い私的な核を強調し、乙女座の月は改善できる仕組みを探します。牡羊座のMCは、公的な道を直接的、競争的、先駆的にします。',
    zh: '巨蟹座太阳与上升点强调本能、保护和强大的私人核心；处女座月亮寻找可持续优化的系统。白羊座天顶让公众道路直接、竞争且具有开创性。',
    ar: 'تؤكد الشمس والطالع في السرطان الغريزة والحماية والنواة الخاصة القوية، بينما يبحث قمر العذراء عن أنظمة قابلة للتحسين. ويجعل الحمل عند منتصف السماء المسار العام مباشرًا وتنافسيًا ورياديًا.',
    ko: '게자리 태양과 상승점은 본능, 보호, 강한 사적 핵심을 강조하고 처녀자리 달은 개선할 시스템을 찾습니다. 양자리 중천은 공적 행보를 직접적이고 경쟁적이며 개척적으로 만듭니다.',
    pl: 'Słońce i Ascendent w Raku podkreślają instynkt, ochronę i silny prywatny rdzeń, a Księżyc w Pannie szuka systemów do ulepszania. Baran na MC czyni drogę publiczną bezpośrednią, konkurencyjną i pionierską.',
    nl: 'Zon en Ascendant in Kreeft benadrukken instinct, bescherming en een sterke privékern, terwijl de Maan in Maagd systemen wil verfijnen. Ram op het MC maakt het publieke pad direct, competitief en pionierend.',
  },
  diana: {
    en: 'A Cancer Sun brings care and emotional visibility; the Aquarius Moon needs independence and a wider social purpose. Sagittarius rising adds candor and reach, while Libra on the Midheaven links the public role with grace, relationship and mediation.',
    de: 'Eine Krebs-Sonne bringt Fürsorge und emotionale Sichtbarkeit; der Wassermann-Mond braucht Unabhängigkeit und einen größeren sozialen Sinn. Schütze-Aszendent gibt Offenheit und Reichweite, Waage am MC verbindet die öffentliche Rolle mit Anmut, Beziehung und Vermittlung.',
    fr: 'Le Soleil en Cancer apporte soin et visibilité émotionnelle ; la Lune en Verseau réclame indépendance et but collectif. L’Ascendant Sagittaire ajoute franchise et portée, tandis que la Balance au MC relie le rôle public à la grâce et à la médiation.',
    it: 'Il Sole in Cancro porta cura e visibilità emotiva; la Luna in Acquario richiede indipendenza e uno scopo sociale più ampio. L’Ascendente Sagittario aggiunge franchezza e portata, mentre la Bilancia al MC lega il ruolo pubblico a grazia e mediazione.',
    es: 'El Sol en Cáncer aporta cuidado y visibilidad emocional; la Luna en Acuario necesita independencia y un propósito social amplio. El Ascendente Sagitario añade franqueza y alcance, mientras Libra en el MC vincula el papel público con gracia y mediación.',
    tr: 'Yengeç Güneş bakım ve duygusal görünürlük getirir; Kova Ay bağımsızlık ve daha geniş bir toplumsal amaç ister. Yay Yükselen açıklık ve erişim katarken Terazi MC kamusal rolü zarafet ve arabuluculukla bağlar.',
    ru: 'Солнце в Раке даёт заботу и эмоциональную заметность; Луне в Водолее нужны независимость и общественная цель. Асцендент в Стрельце добавляет открытость и масштаб, а Весы на МС связывают публичную роль с грацией и посредничеством.',
    pt: 'O Sol em Câncer traz cuidado e visibilidade emocional; a Lua em Aquário precisa de independência e propósito social. O Ascendente em Sagitário acrescenta franqueza e alcance, enquanto Libra no MC liga o papel público à graça e mediação.',
    ja: '蟹座の太陽は思いやりと感情的な存在感をもたらし、水瓶座の月は自立と社会的目的を求めます。射手座上昇は率直さと広がりを加え、天秤座MCは公的役割を優雅さと仲介に結びつけます。',
    zh: '巨蟹座太阳带来照护与情感可见度；水瓶座月亮需要独立和更广泛的社会意义。射手座上升点增加坦率与影响范围，天秤座天顶则把公众角色与优雅、关系及调和联系起来。',
    ar: 'تجلب شمس السرطان الرعاية والحضور العاطفي، بينما يحتاج قمر الدلو إلى الاستقلال وغاية اجتماعية أوسع. يضيف طالع القوس الصراحة والانتشار، وتربط الميزان عند منتصف السماء الدور العام بالنعمة والوساطة.',
    ko: '게자리 태양은 돌봄과 감정적 가시성을, 물병자리 달은 독립과 더 넓은 사회적 목적을 요구합니다. 사수자리 상승점은 솔직함과 확장을, 천칭자리 중천은 공적 역할에 우아함과 조정을 더합니다.',
    pl: 'Słońce w Raku wnosi troskę i emocjonalną widoczność; Księżyc w Wodniku potrzebuje niezależności i szerszego celu społecznego. Ascendent w Strzelcu dodaje szczerości i zasięgu, a Waga na MC łączy rolę publiczną z wdziękiem i mediacją.',
    nl: 'De Zon in Kreeft brengt zorg en emotionele zichtbaarheid; de Maan in Waterman verlangt onafhankelijkheid en een groter sociaal doel. Boogschutter rijzend geeft openheid en bereik, terwijl Weegschaal op het MC de publieke rol verbindt met gratie en bemiddeling.',
  },
  einstein: {
    en: 'Pisces Sun and Pisces Midheaven favor imagination, synthesis and seeing beyond fixed categories. A Sagittarius Moon seeks broad principles, while Cancer rising gives the thinker a more protective and personally responsive outer style.',
    de: 'Fische-Sonne und Fische-MC begünstigen Vorstellungskraft, Synthese und den Blick über feste Kategorien hinaus. Der Schütze-Mond sucht große Prinzipien, während Krebs-Aszendent dem Denker eine schützende und persönlich reagierende Außenwirkung gibt.',
    fr: 'Soleil et MC en Poissons favorisent imagination, synthèse et vision au-delà des catégories fixes. La Lune en Sagittaire cherche de grands principes, tandis que l’Ascendant Cancer donne au penseur une présence protectrice et réceptive.',
    it: 'Sole e MC in Pesci favoriscono immaginazione, sintesi e visione oltre le categorie fisse. La Luna in Sagittario cerca grandi principi, mentre l’Ascendente Cancro dà al pensatore uno stile esterno protettivo e ricettivo.',
    es: 'Sol y MC en Piscis favorecen imaginación, síntesis y visión más allá de categorías fijas. La Luna en Sagitario busca principios amplios, mientras el Ascendente Cáncer da al pensador un estilo exterior protector y receptivo.',
    tr: 'Balık Güneş ve MC hayal gücü, sentez ve sabit kategorilerin ötesini görmeyi destekler. Yay Ay geniş ilkeler ararken Yengeç Yükselen düşünürün dış tarzına koruyucu ve duyarlı bir ton verir.',
    ru: 'Солнце и МС в Рыбах поддерживают воображение, синтез и взгляд за пределы фиксированных категорий. Луна в Стрельце ищет общие принципы, а Асцендент в Раке придаёт мыслителю защитный и отзывчивый внешний стиль.',
    pt: 'Sol e MC em Peixes favorecem imaginação, síntese e visão além de categorias fixas. A Lua em Sagitário busca princípios amplos, enquanto o Ascendente em Câncer dá ao pensador um estilo protetor e receptivo.',
    ja: '魚座の太陽とMCは、想像力、統合、固定概念を超える視点を促します。射手座の月は普遍的な原理を求め、蟹座上昇は思索家に保護的で応答的な外面を与えます。',
    zh: '双鱼座太阳与天顶有利于想象、综合以及超越固定分类的视角。射手座月亮追求宏大原理，巨蟹座上升点则让思想家的外在方式更具保护性与回应性。',
    ar: 'تدعم الشمس ومنتصف السماء في الحوت الخيال والتركيب والرؤية خارج التصنيفات الثابتة. يبحث قمر القوس عن المبادئ الكبرى، ويمنح طالع السرطان المفكر أسلوبًا خارجيًا حاميًا ومتجاوبًا.',
    ko: '물고기자리 태양과 중천은 상상력, 통합, 고정된 범주 너머의 시야를 돕습니다. 사수자리 달은 넓은 원리를 찾고, 게자리 상승점은 사상가에게 보호적이고 반응적인 외적 태도를 줍니다.',
    pl: 'Słońce i MC w Rybach sprzyjają wyobraźni, syntezie i widzeniu poza sztywnymi kategoriami. Księżyc w Strzelcu szuka szerokich zasad, a Ascendent w Raku nadaje myślicielowi ochronny i wrażliwy styl zewnętrzny.',
    nl: 'Zon en MC in Vissen bevorderen verbeelding, synthese en kijken voorbij vaste categorieën. De Maan in Boogschutter zoekt brede principes, terwijl Kreeft rijzend de denker een beschermende en responsieve buitenkant geeft.',
  },
  monroe: {
    en: 'A Gemini Sun gives verbal agility and multiplicity; an Aquarius Moon protects emotional independence. Leo rising heightens theatrical presence, while Taurus on the Midheaven connects the public image with beauty, sensuality and durability.',
    de: 'Eine Zwillinge-Sonne gibt sprachliche Beweglichkeit und Vielseitigkeit; der Wassermann-Mond schützt emotionale Unabhängigkeit. Löwe-Aszendent verstärkt die Bühnenpräsenz, Stier am MC verbindet das öffentliche Bild mit Schönheit, Sinnlichkeit und Beständigkeit.',
    fr: 'Le Soleil en Gémeaux donne agilité verbale et multiplicité ; la Lune en Verseau protège l’indépendance émotionnelle. L’Ascendant Lion renforce la présence théâtrale, et le Taureau au MC relie l’image publique à la beauté et à la sensualité.',
    it: 'Il Sole in Gemelli dà agilità verbale e molteplicità; la Luna in Acquario protegge l’indipendenza emotiva. L’Ascendente Leone amplifica la presenza teatrale, mentre il Toro al MC lega l’immagine pubblica a bellezza e sensualità.',
    es: 'El Sol en Géminis aporta agilidad verbal y multiplicidad; la Luna en Acuario protege la independencia emocional. El Ascendente Leo intensifica la presencia teatral, y Tauro en el MC une la imagen pública con belleza y sensualidad.',
    tr: 'İkizler Güneş sözel çeviklik ve çok yönlülük verir; Kova Ay duygusal bağımsızlığı korur. Aslan Yükselen teatral varlığı büyütür, Boğa MC ise kamusal imajı güzellik ve duyusallıkla bağlar.',
    ru: 'Солнце в Близнецах даёт словесную гибкость и многогранность; Луна в Водолее бережёт эмоциональную независимость. Асцендент во Льве усиливает сценическое присутствие, а Телец на МС связывает публичный образ с красотой и чувственностью.',
    pt: 'O Sol em Gêmeos traz agilidade verbal e multiplicidade; a Lua em Aquário protege a independência emocional. O Ascendente em Leão amplia a presença teatral, enquanto Touro no MC liga a imagem pública à beleza e sensualidade.',
    ja: '双子座の太陽は言葉の機敏さと多面性を、水瓶座の月は感情的な自立をもたらします。獅子座上昇は劇的な存在感を高め、牡牛座MCは公的イメージを美と官能に結びつけます。',
    zh: '双子座太阳带来语言敏捷与多面性；水瓶座月亮保护情感独立。狮子座上升点强化舞台存在感，金牛座天顶则把公众形象与美、感官魅力和持久性联系起来。',
    ar: 'تمنح شمس الجوزاء مرونة لفظية وتعددًا، ويحمي قمر الدلو الاستقلال العاطفي. يرفع طالع الأسد الحضور المسرحي، ويربط الثور عند منتصف السماء الصورة العامة بالجمال والحسية.',
    ko: '쌍둥이자리 태양은 언어적 민첩성과 다면성을, 물병자리 달은 감정적 독립을 줍니다. 사자자리 상승점은 극적인 존재감을 키우고, 황소자리 중천은 대중 이미지를 아름다움과 감각성에 연결합니다.',
    pl: 'Słońce w Bliźniętach daje sprawność słowa i wielość, a Księżyc w Wodniku chroni niezależność emocjonalną. Ascendent w Lwie wzmacnia sceniczną obecność, a Byk na MC łączy wizerunek publiczny z pięknem i zmysłowością.',
    nl: 'De Zon in Tweelingen geeft verbale behendigheid en veelzijdigheid; de Maan in Waterman bewaakt emotionele onafhankelijkheid. Leeuw rijzend versterkt de theatrale aanwezigheid, terwijl Stier op het MC het publieke beeld verbindt met schoonheid en sensualiteit.',
  },
  jobs: {
    en: 'A Pisces Sun supplies intuition and aesthetic synthesis, while an Aries Moon reacts quickly and independently. Virgo rising edits the presentation; Gemini on the Midheaven makes communication, products and ideas central to the public role.',
    de: 'Eine Fische-Sonne liefert Intuition und ästhetische Synthese, der Widder-Mond reagiert schnell und unabhängig. Jungfrau-Aszendent kuratiert die Außenwirkung; Zwillinge am MC machen Kommunikation, Produkte und Ideen zentral für die öffentliche Rolle.',
    fr: 'Le Soleil en Poissons apporte intuition et synthèse esthétique, tandis que la Lune en Bélier réagit vite et librement. L’Ascendant Vierge affine la présentation ; les Gémeaux au MC placent communication, produits et idées au centre du rôle public.',
    it: 'Il Sole in Pesci porta intuizione e sintesi estetica, mentre la Luna in Ariete reagisce rapidamente e in autonomia. L’Ascendente Vergine cura la presentazione; i Gemelli al MC rendono centrali comunicazione, prodotti e idee.',
    es: 'El Sol en Piscis aporta intuición y síntesis estética; la Luna en Aries reacciona rápido e independiente. El Ascendente Virgo edita la presentación, y Géminis en el MC hace centrales la comunicación, los productos y las ideas.',
    tr: 'Balık Güneş sezgi ve estetik sentez sağlar, Koç Ay hızlı ve bağımsız tepki verir. Başak Yükselen sunumu inceltir; İkizler MC iletişim, ürün ve fikirleri kamusal rolün merkezine koyar.',
    ru: 'Солнце в Рыбах даёт интуицию и эстетический синтез, а Луна в Овне реагирует быстро и независимо. Асцендент в Деве шлифует подачу; Близнецы на МС делают коммуникацию, продукты и идеи центром публичной роли.',
    pt: 'O Sol em Peixes traz intuição e síntese estética; a Lua em Áries reage rápido e com independência. O Ascendente em Virgem refina a apresentação, e Gêmeos no MC coloca comunicação, produtos e ideias no centro do papel público.',
    ja: '魚座の太陽は直感と美的統合を、牡羊座の月は素早く独立した反応をもたらします。乙女座上昇は見せ方を磨き、双子座MCはコミュニケーション、製品、アイデアを公的役割の中心にします。',
    zh: '双鱼座太阳提供直觉与审美综合，白羊座月亮反应迅速且独立。处女座上升点修整表达方式；双子座天顶让沟通、产品与思想成为公众角色的核心。',
    ar: 'تمنح شمس الحوت الحدس والتركيب الجمالي، بينما يستجيب قمر الحمل بسرعة واستقلال. يصقل طالع العذراء طريقة التقديم، ويضع الجوزاء عند منتصف السماء التواصل والمنتجات والأفكار في مركز الدور العام.',
    ko: '물고기자리 태양은 직관과 미적 통합을, 양자리 달은 빠르고 독립적인 반응을 줍니다. 처녀자리 상승점은 표현을 다듬고, 쌍둥이자리 중천은 소통·제품·아이디어를 공적 역할의 중심에 둡니다.',
    pl: 'Słońce w Rybach daje intuicję i syntezę estetyczną, a Księżyc w Baranie reaguje szybko i niezależnie. Ascendent w Pannie dopracowuje prezentację; Bliźnięta na MC stawiają komunikację, produkty i idee w centrum roli publicznej.',
    nl: 'De Zon in Vissen geeft intuïtie en esthetische synthese, terwijl de Maan in Ram snel en zelfstandig reageert. Maagd rijzend redigeert de presentatie; Tweelingen op het MC maken communicatie, producten en ideeën centraal in de publieke rol.',
  },
  kahlo: {
    en: 'A Cancer Sun roots identity in memory, belonging and protection. The Taurus Moon seeks physical continuity and form; Leo rising makes the self visible, while Taurus on the Midheaven turns material, body and beauty into enduring public language.',
    de: 'Eine Krebs-Sonne verwurzelt Identität in Erinnerung, Zugehörigkeit und Schutz. Der Stier-Mond sucht körperliche Beständigkeit und Form; Löwe-Aszendent macht das Selbst sichtbar, während Stier am MC Material, Körper und Schönheit in dauerhafte öffentliche Sprache übersetzt.',
    fr: 'Le Soleil en Cancer enracine l’identité dans la mémoire et l’appartenance. La Lune en Taureau cherche continuité et forme ; l’Ascendant Lion rend le moi visible, tandis que le Taureau au MC transforme matière, corps et beauté en langage public durable.',
    it: 'Il Sole in Cancro radica l’identità nella memoria e nell’appartenenza. La Luna in Toro cerca continuità fisica e forma; l’Ascendente Leone rende visibile il sé, mentre il Toro al MC trasforma materia, corpo e bellezza in linguaggio pubblico duraturo.',
    es: 'El Sol en Cáncer arraiga la identidad en memoria y pertenencia. La Luna en Tauro busca continuidad física y forma; el Ascendente Leo vuelve visible el yo, mientras Tauro en el MC transforma materia, cuerpo y belleza en lenguaje público duradero.',
    tr: 'Yengeç Güneş kimliği hafıza, aidiyet ve korunmaya kökler. Boğa Ay bedensel süreklilik ve biçim arar; Aslan Yükselen benliği görünür kılar, Boğa MC ise madde, beden ve güzelliği kalıcı kamusal dile dönüştürür.',
    ru: 'Солнце в Раке укореняет идентичность в памяти, принадлежности и защите. Луна в Тельце ищет телесную устойчивость и форму; Асцендент во Льве делает «я» видимым, а Телец на МС превращает материю, тело и красоту в долговечный публичный язык.',
    pt: 'O Sol em Câncer enraíza a identidade em memória e pertencimento. A Lua em Touro busca continuidade física e forma; o Ascendente em Leão torna o eu visível, enquanto Touro no MC transforma matéria, corpo e beleza em linguagem pública duradoura.',
    ja: '蟹座の太陽は自己を記憶、所属、保護に根づかせます。牡牛座の月は身体的な持続と形を求め、獅子座上昇は自己を可視化し、牡牛座MCは物質、身体、美を長く残る公的言語へ変えます。',
    zh: '巨蟹座太阳把身份扎根于记忆、归属与保护。金牛座月亮寻求身体上的连续性和形式；狮子座上升点让自我可见，而金牛座天顶把物质、身体与美转化为持久的公众语言。',
    ar: 'تجذر شمس السرطان الهوية في الذاكرة والانتماء والحماية. يبحث قمر الثور عن الاستمرارية الجسدية والشكل، ويجعل طالع الأسد الذات مرئية، بينما يحول الثور عند منتصف السماء المادة والجسد والجمال إلى لغة عامة باقية.',
    ko: '게자리 태양은 정체성을 기억, 소속, 보호에 뿌리내립니다. 황소자리 달은 신체적 지속성과 형태를 찾고, 사자자리 상승점은 자아를 보이게 하며, 황소자리 중천은 물질·몸·아름다움을 오래가는 공적 언어로 바꿉니다.',
    pl: 'Słońce w Raku zakorzenia tożsamość w pamięci, przynależności i ochronie. Księżyc w Byku szuka cielesnej ciągłości i formy; Ascendent w Lwie uwidacznia „ja”, a Byk na MC zamienia materię, ciało i piękno w trwały język publiczny.',
    nl: 'De Zon in Kreeft wortelt identiteit in herinnering, verbondenheid en bescherming. De Maan in Stier zoekt lichamelijke continuïteit en vorm; Leeuw rijzend maakt het zelf zichtbaar, terwijl Stier op het MC materie, lichaam en schoonheid in blijvende publieke taal omzet.',
  },
};

const COPY = {
  en: { label: 'CELEBRITY ASTROLOGY', h1: (n) => `${n} astrocartography & astrology`, lead: (n) => `Explore ${n}’s astrocartography map, natal chart and symbolic astrology reading. The interactive chart uses the documented birth data shown below.`, birth: 'Birth data used', date: 'Date', time: 'Local time', place: 'Birthplace', coords: 'Coordinates', big4: 'The natal-chart foundation', reading: (n) => `${n}: chart interpretation`, live: (n) => `${n} astrocartography live map`, liveIntro: 'Drag the globe, switch planets and open Personality to inspect the natal chart. This is the real Natal Navigator demo, preloaded with this celebrity.', mapReading: 'How to read this astrocartography map', mapBody: (n) => `${n}’s map shows where each natal planet was rising, setting, culminating or at the lower meridian. Use the live chart to compare Sun, Moon, Venus, Jupiter and Saturn lines; proximity suggests symbolic emphasis, not a guaranteed event.`, locations: 'Michael Jackson astrocartography: places and life parallels', locationIntro: 'The comparisons below are retrospective. They show where documented events happened near notable lines; they do not prove that astrology caused those events.', sources: 'Biographical sources', related: 'Explore another celebrity chart', method: 'Interpretive note', methodText: 'Astrocartography and astrology are symbolic traditions, not scientifically validated causal methods. Birth-time accuracy and map projection affect line position. A life event can have many ordinary causes; this reading is offered for reflection.', faqs: ['What does Michael Jackson’s astrocartography chart show?', 'Where was Michael Jackson born?', 'Is this reading a factual biography?'], create: 'Create your own map', open: 'Open full-screen chart', bornAnswer: 'Michael Jackson was born on August 29, 1958 at 7:33 PM CDT at St. Mary’s Mercy Hospital in Gary, Indiana.', bioAnswer: 'The biographical dates and places are sourced; the astrological links are retrospective symbolic interpretations, not scientific or causal claims.' },
  de: { label: 'PROMINENTEN-ASTROLOGIE', h1: (n) => `${n}: Astrokartographie & Astrologie`, lead: (n) => `Entdecke ${n}s Astrokartographie-Karte, Geburtshoroskop und symbolische astrologische Deutung. Das interaktive Chart nutzt die unten dokumentierten Geburtsdaten.`, birth: 'Verwendete Geburtsdaten', date: 'Datum', time: 'Ortszeit', place: 'Geburtsort', coords: 'Koordinaten', big4: 'Die Grundlage des Geburtshoroskops', reading: (n) => `${n}: Chart-Deutung`, live: (n) => `${n}s Astrokartographie live`, liveIntro: 'Drehe den Globus, schalte Planeten um und öffne „Personality“, um das Geburtshoroskop zu sehen. Das ist die echte Natal-Navigator-Demo, bereits mit diesem Celebrity geladen.', mapReading: 'So liest du diese Astrokartographie-Karte', mapBody: (n) => `${n}s Karte zeigt, wo jeder Geburtsplanet aufstieg, unterging, kulminierte oder am unteren Meridian stand. Vergleiche in der Live-Karte Sonne, Mond, Venus, Jupiter und Saturn; Nähe steht für symbolische Betonung, nicht für ein garantiertes Ereignis.`, locations: 'Michael Jackson Astrokartographie: Orte und Lebensparallelen', locationIntro: 'Die Vergleiche sind rückblickend. Sie zeigen dokumentierte Ereignisse in der Nähe auffälliger Linien; sie beweisen nicht, dass Astrologie diese Ereignisse verursacht hat.', sources: 'Biografische Quellen', related: 'Weiteres Celebrity-Chart öffnen', method: 'Hinweis zur Deutung', methodText: 'Astrokartographie und Astrologie sind symbolische Traditionen, keine wissenschaftlich bestätigten Kausalmethoden. Geburtszeit und Kartenprojektion beeinflussen die Linienlage. Lebensereignisse haben viele reale Ursachen; diese Deutung dient der Reflexion.', faqs: ['Was zeigt Michael Jacksons Astrokartographie?', 'Wo wurde Michael Jackson geboren?', 'Ist diese Deutung eine Tatsachenbiografie?'], create: 'Eigene Karte erstellen', open: 'Chart im Vollbild öffnen', bornAnswer: 'Michael Jackson wurde am 29. August 1958 um 19:33 Uhr CDT im St. Mary’s Mercy Hospital in Gary, Indiana, geboren.', bioAnswer: 'Biografische Daten und Orte sind belegt; die astrologischen Verbindungen sind rückblickende symbolische Deutungen und keine wissenschaftlichen oder kausalen Aussagen.' },
  fr: { label: 'ASTROLOGIE DES CÉLÉBRITÉS', h1: (n) => `${n} : astrocartographie et astrologie`, lead: (n) => `Explorez la carte d’astrocartographie, le thème natal et l’interprétation symbolique de ${n}. Le thème interactif utilise les données de naissance indiquées ci-dessous.`, birth: 'Données de naissance utilisées', date: 'Date', time: 'Heure locale', place: 'Lieu de naissance', coords: 'Coordonnées', big4: 'La base du thème natal', reading: (n) => `${n} : interprétation du thème`, live: (n) => `Carte d’astrocartographie en direct de ${n}`, liveIntro: 'Faites tourner le globe, changez de planète et ouvrez Personality pour voir le thème natal. La démo réelle de Natal Navigator est préchargée avec cette célébrité.', mapReading: 'Comment lire cette carte', mapBody: (n) => `La carte de ${n} montre où chaque planète natale se levait, se couchait ou culminait. Comparez Soleil, Lune, Vénus, Jupiter et Saturne ; la proximité suggère un accent symbolique, jamais un événement garanti.`, locations: 'Astrocartographie de Michael Jackson : lieux et parallèles de vie', locationIntro: 'Ces comparaisons sont rétrospectives. Elles relient des événements documentés à des lignes proches sans prouver une causalité astrologique.', sources: 'Sources biographiques', related: 'Explorer un autre thème célèbre', method: 'Note d’interprétation', methodText: 'L’astrocartographie et l’astrologie sont des traditions symboliques, non des méthodes causales validées scientifiquement. L’heure de naissance et la projection influencent les lignes.', faqs: ['Que montre l’astrocartographie de Michael Jackson ?', 'Où Michael Jackson est-il né ?', 'Cette lecture est-elle une biographie factuelle ?'], create: 'Créer ma carte', open: 'Ouvrir en plein écran', bornAnswer: 'Michael Jackson est né le 29 août 1958 à 19 h 33 CDT au St. Mary’s Mercy Hospital de Gary, Indiana.', bioAnswer: 'Les dates et lieux biographiques sont sourcés ; les liens astrologiques sont des interprétations symboliques rétrospectives, non des affirmations causales.' },
  it: { label: 'ASTROLOGIA DELLE CELEBRITÀ', h1: (n) => `${n}: astrocartografia e astrologia`, lead: (n) => `Esplora la mappa di astrocartografia, il tema natale e la lettura astrologica simbolica di ${n}. Il tema interattivo usa i dati di nascita indicati sotto.`, birth: 'Dati di nascita utilizzati', date: 'Data', time: 'Ora locale', place: 'Luogo di nascita', coords: 'Coordinate', big4: 'La base del tema natale', reading: (n) => `${n}: interpretazione del tema`, live: (n) => `Mappa astrocartografica live di ${n}`, liveIntro: 'Ruota il globo, cambia pianeta e apri Personality per vedere il tema natale. È la vera demo di Natal Navigator, già caricata con questa celebrità.', mapReading: 'Come leggere questa mappa', mapBody: (n) => `La mappa di ${n} mostra dove ogni pianeta natale sorgeva, tramontava o culminava. Confronta Sole, Luna, Venere, Giove e Saturno; la vicinanza suggerisce enfasi simbolica, non eventi garantiti.`, locations: 'Astrocartografia di Michael Jackson: luoghi e paralleli biografici', locationIntro: 'I confronti sono retrospettivi e non provano che l’astrologia abbia causato gli eventi.', sources: 'Fonti biografiche', related: 'Esplora un altro tema famoso', method: 'Nota interpretativa', methodText: 'Astrocartografia e astrologia sono tradizioni simboliche, non metodi causali convalidati scientificamente. Ora di nascita e proiezione influenzano le linee.', faqs: ['Cosa mostra la carta di Michael Jackson?', 'Dove è nato Michael Jackson?', 'Questa lettura è una biografia fattuale?'], create: 'Crea la tua mappa', open: 'Apri a schermo intero', bornAnswer: 'Michael Jackson nacque il 29 agosto 1958 alle 19:33 CDT allo St. Mary’s Mercy Hospital di Gary, Indiana.', bioAnswer: 'Date e luoghi biografici sono documentati; i collegamenti astrologici sono interpretazioni simboliche retrospettive.' },
  es: { label: 'ASTROLOGÍA DE CELEBRIDADES', h1: (n) => `${n}: astrocartografía y astrología`, lead: (n) => `Explora el mapa de astrocartografía, la carta natal y la interpretación astrológica simbólica de ${n}. La carta interactiva usa los datos de nacimiento indicados abajo.`, birth: 'Datos de nacimiento utilizados', date: 'Fecha', time: 'Hora local', place: 'Lugar de nacimiento', coords: 'Coordenadas', big4: 'La base de la carta natal', reading: (n) => `${n}: interpretación de la carta`, live: (n) => `Mapa astrocartográfico en vivo de ${n}`, liveIntro: 'Gira el globo, cambia planetas y abre Personality para ver la carta natal. Es la demo real de Natal Navigator, precargada con esta celebridad.', mapReading: 'Cómo leer este mapa', mapBody: (n) => `El mapa de ${n} muestra dónde cada planeta natal ascendía, descendía o culminaba. Compara Sol, Luna, Venus, Júpiter y Saturno; la cercanía sugiere énfasis simbólico, no un suceso garantizado.`, locations: 'Astrocartografía de Michael Jackson: lugares y paralelos vitales', locationIntro: 'Las comparaciones son retrospectivas. Relacionan hechos documentados con líneas cercanas sin demostrar causalidad astrológica.', sources: 'Fuentes biográficas', related: 'Explora otra carta famosa', method: 'Nota interpretativa', methodText: 'La astrocartografía y la astrología son tradiciones simbólicas, no métodos causales validados científicamente. La hora natal y la proyección afectan las líneas.', faqs: ['¿Qué muestra la astrocartografía de Michael Jackson?', '¿Dónde nació Michael Jackson?', '¿Es esta lectura una biografía factual?'], create: 'Crear mi mapa', open: 'Abrir carta completa', bornAnswer: 'Michael Jackson nació el 29 de agosto de 1958 a las 7:33 p. m. CDT en St. Mary’s Mercy Hospital, Gary, Indiana.', bioAnswer: 'Las fechas y lugares biográficos están documentados; los vínculos astrológicos son interpretaciones simbólicas retrospectivas.' },
  tr: { label: 'ÜNLÜ ASTROLOJİSİ', h1: (n) => `${n} astrokartografi ve astroloji`, lead: (n) => `${n} için astrokartografi haritasını, doğum haritasını ve sembolik astroloji yorumunu keşfedin. Etkileşimli harita aşağıdaki doğum verilerini kullanır.`, birth: 'Kullanılan doğum bilgileri', date: 'Tarih', time: 'Yerel saat', place: 'Doğum yeri', coords: 'Koordinatlar', big4: 'Doğum haritasının temeli', reading: (n) => `${n}: harita yorumu`, live: (n) => `${n} canlı astrokartografi haritası`, liveIntro: 'Küreyi döndürün, gezegenleri değiştirin ve doğum haritası için Personality bölümünü açın. Gerçek Natal Navigator demosu bu ünlüyle yüklüdür.', mapReading: 'Bu harita nasıl okunur?', mapBody: (n) => `${n} haritası doğum gezegenlerinin nerede yükseldiğini, battığını veya tepeye ulaştığını gösterir. Yakınlık sembolik vurgu önerir; olay garantilemez.`, locations: 'Michael Jackson astrokartografisi: yerler ve yaşam paralellikleri', locationIntro: 'Karşılaştırmalar geriye dönüktür ve astrolojik nedenselliği kanıtlamaz.', sources: 'Biyografik kaynaklar', related: 'Başka bir ünlü haritası', method: 'Yorum notu', methodText: 'Astrokartografi ve astroloji sembolik geleneklerdir; bilimsel olarak doğrulanmış nedensel yöntemler değildir. Doğum saati ve projeksiyon çizgileri etkiler.', faqs: ['Michael Jackson’ın haritası ne gösterir?', 'Michael Jackson nerede doğdu?', 'Bu yorum olgusal bir biyografi mi?'], create: 'Kendi haritanı oluştur', open: 'Tam ekran aç', bornAnswer: 'Michael Jackson 29 Ağustos 1958’de saat 19:33 CDT’de Gary, Indiana’daki St. Mary’s Mercy Hospital’da doğdu.', bioAnswer: 'Biyografik tarih ve yerler kaynaklıdır; astrolojik bağlantılar geriye dönük sembolik yorumlardır.' },
  ru: { label: 'АСТРОЛОГИЯ ЗНАМЕНИТОСТЕЙ', h1: (n) => `${n}: астрокартография и астрология`, lead: (n) => `Исследуйте астрокартографическую и натальную карты ${n} с символической интерпретацией. Интерактивная карта использует указанные ниже данные рождения.`, birth: 'Использованные данные рождения', date: 'Дата', time: 'Местное время', place: 'Место рождения', coords: 'Координаты', big4: 'Основа натальной карты', reading: (n) => `${n}: интерпретация карты`, live: (n) => `Интерактивная карта ${n}`, liveIntro: 'Вращайте глобус, переключайте планеты и откройте Personality для натальной карты. Это настоящая демоверсия Natal Navigator с выбранной знаменитостью.', mapReading: 'Как читать эту карту', mapBody: (n) => `Карта ${n} показывает, где каждая натальная планета восходила, заходила или кульминировала. Близость означает символический акцент, но не гарантирует события.`, locations: 'Астрокартография Майкла Джексона: места и жизненные параллели', locationIntro: 'Сравнения ретроспективны и не доказывают астрологическую причинность.', sources: 'Биографические источники', related: 'Другая карта знаменитости', method: 'Примечание', methodText: 'Астрокартография и астрология — символические традиции, а не научно подтверждённые причинные методы. Время рождения и проекция влияют на линии.', faqs: ['Что показывает карта Майкла Джексона?', 'Где родился Майкл Джексон?', 'Является ли это фактической биографией?'], create: 'Создать свою карту', open: 'Открыть во весь экран', bornAnswer: 'Майкл Джексон родился 29 августа 1958 года в 19:33 CDT в больнице St. Mary’s Mercy Hospital, Гэри, Индиана.', bioAnswer: 'Биографические даты и места снабжены источниками; астрологические связи — ретроспективные символические интерпретации.' },
  pt: { label: 'ASTROLOGIA DE CELEBRIDADES', h1: (n) => `${n}: astrocartografia e astrologia`, lead: (n) => `Explore o mapa de astrocartografia, o mapa natal e a leitura astrológica simbólica de ${n}. O mapa interativo usa os dados de nascimento abaixo.`, birth: 'Dados de nascimento usados', date: 'Data', time: 'Hora local', place: 'Local de nascimento', coords: 'Coordenadas', big4: 'A base do mapa natal', reading: (n) => `${n}: interpretação do mapa`, live: (n) => `Mapa astrocartográfico ao vivo de ${n}`, liveIntro: 'Gire o globo, alterne planetas e abra Personality para ver o mapa natal. É a demo real do Natal Navigator, carregada com esta celebridade.', mapReading: 'Como ler este mapa', mapBody: (n) => `O mapa de ${n} mostra onde cada planeta natal nascia, se punha ou culminava. A proximidade sugere ênfase simbólica, não um evento garantido.`, locations: 'Astrocartografia de Michael Jackson: lugares e paralelos de vida', locationIntro: 'As comparações são retrospectivas e não provam causalidade astrológica.', sources: 'Fontes biográficas', related: 'Explore outro mapa famoso', method: 'Nota interpretativa', methodText: 'Astrocartografia e astrologia são tradições simbólicas, não métodos causais validados cientificamente. Hora natal e projeção afetam as linhas.', faqs: ['O que mostra o mapa de Michael Jackson?', 'Onde Michael Jackson nasceu?', 'Esta leitura é uma biografia factual?'], create: 'Criar meu mapa', open: 'Abrir em tela cheia', bornAnswer: 'Michael Jackson nasceu em 29 de agosto de 1958, às 19h33 CDT, no St. Mary’s Mercy Hospital em Gary, Indiana.', bioAnswer: 'Datas e lugares biográficos são documentados; os vínculos astrológicos são interpretações simbólicas retrospectivas.' },
  ja: { label: 'セレブ占星術', h1: (n) => `${n}のアストロカートグラフィーと占星術`, lead: (n) => `${n}のアストロカートグラフィー地図、出生図、象徴的な占星術解釈を紹介します。インタラクティブ図は以下の出生データを使用します。`, birth: '使用した出生データ', date: '日付', time: '現地時刻', place: '出生地', coords: '座標', big4: '出生図の基礎', reading: (n) => `${n}のチャート解釈`, live: (n) => `${n}のライブ地図`, liveIntro: '地球儀を回し、惑星を切り替え、Personalityで出生図を確認できます。このセレブを読み込んだ実際のNatal Navigatorデモです。', mapReading: 'この地図の読み方', mapBody: (n) => `${n}の地図は、各出生惑星が昇る・沈む・南中する場所を示します。近さは象徴的な強調を示しますが、出来事を保証しません。`, locations: 'マイケル・ジャクソンのアストロカートグラフィー：場所と人生の対応', locationIntro: '以下は回顧的な比較であり、占星術的な因果関係を証明するものではありません。', sources: '伝記資料', related: '別のセレブの図を見る', method: '解釈上の注意', methodText: 'アストロカートグラフィーと占星術は象徴的伝統で、科学的に検証された因果的方法ではありません。出生時刻と投影法が線の位置に影響します。', faqs: ['マイケル・ジャクソンの地図は何を示す？', '出生地はどこ？', 'この解釈は事実上の伝記？'], create: '自分の地図を作る', open: '全画面で開く', bornAnswer: 'マイケル・ジャクソンは1958年8月29日午後7時33分（CDT）、インディアナ州ゲーリーのSt. Mary’s Mercy Hospitalで生まれました。', bioAnswer: '伝記上の日付と場所には出典があります。占星術的な関連は回顧的な象徴解釈です。' },
  zh: { label: '名人占星', h1: (n) => `${n}星盘与占星地理学`, lead: (n) => `探索${n}的占星地理地图、本命盘和象征性占星解读。互动星盘采用下方所列出生资料。`, birth: '采用的出生资料', date: '日期', time: '当地时间', place: '出生地', coords: '坐标', big4: '本命盘基础', reading: (n) => `${n}星盘解读`, live: (n) => `${n}互动占星地理地图`, liveIntro: '旋转地球、切换行星，并打开Personality查看本命盘。这是已加载该名人的真实Natal Navigator演示。', mapReading: '如何阅读这张地图', mapBody: (n) => `${n}的地图显示各本命行星在哪里升起、落下或到达天顶。靠近某条线表示象征性强调，并不保证事件发生。`, locations: '迈克尔·杰克逊占星地理：地点与人生呼应', locationIntro: '以下为回顾性比较，不证明占星具有因果作用。', sources: '传记来源', related: '探索其他名人星盘', method: '解读说明', methodText: '占星地理与占星术属于象征传统，不是经科学验证的因果方法。出生时间和地图投影会影响线的位置。', faqs: ['迈克尔·杰克逊的地图显示什么？', '迈克尔·杰克逊出生在哪里？', '这是一篇事实传记吗？'], create: '创建我的地图', open: '全屏打开', bornAnswer: '迈克尔·杰克逊于1958年8月29日19:33（CDT）出生在印第安纳州加里市St. Mary’s Mercy Hospital。', bioAnswer: '传记日期与地点均有来源；占星联系属于回顾性的象征解读。' },
  ar: { label: 'تنجيم المشاهير', h1: (n) => `الخريطة الفلكية والتنجيم لـ ${n}`, lead: (n) => `استكشف خريطة astrocartography وخريطة الميلاد والقراءة الرمزية لـ ${n}. تستخدم الخريطة التفاعلية بيانات الميلاد أدناه.`, birth: 'بيانات الميلاد المستخدمة', date: 'التاريخ', time: 'الوقت المحلي', place: 'مكان الميلاد', coords: 'الإحداثيات', big4: 'أساس خريطة الميلاد', reading: (n) => `تفسير خريطة ${n}`, live: (n) => `خريطة ${n} التفاعلية`, liveIntro: 'أدر الكرة الأرضية وبدّل الكواكب وافتح Personality لرؤية خريطة الميلاد. هذا هو العرض الحقيقي من Natal Navigator محمّلًا بهذا المشهور.', mapReading: 'كيف تُقرأ هذه الخريطة', mapBody: (n) => `توضح خريطة ${n} أين كان كل كوكب يولد أو يغرب أو يبلغ الذروة. القرب يشير إلى تأكيد رمزي ولا يضمن حدثًا.`, locations: 'الخريطة الفلكية لمايكل جاكسون: الأماكن وتشابهات الحياة', locationIntro: 'المقارنات استرجاعية ولا تثبت سببية فلكية.', sources: 'مصادر السيرة', related: 'استكشف خريطة مشهور آخر', method: 'ملاحظة تفسيرية', methodText: 'الخرائط الفلكية والتنجيم تقاليد رمزية وليست طرقًا سببية مثبتة علميًا. يؤثر وقت الميلاد والإسقاط في مواضع الخطوط.', faqs: ['ماذا تُظهر خريطة مايكل جاكسون؟', 'أين وُلد مايكل جاكسون؟', 'هل هذه سيرة واقعية؟'], create: 'أنشئ خريطتي', open: 'فتح ملء الشاشة', bornAnswer: 'وُلد مايكل جاكسون في 29 أغسطس 1958 الساعة 7:33 مساءً CDT في مستشفى St. Mary’s Mercy في غاري، إنديانا.', bioAnswer: 'تواريخ وأماكن السيرة موثقة؛ الروابط الفلكية تفسيرات رمزية استرجاعية.' },
  ko: { label: '셀러브리티 점성술', h1: (n) => `${n} 아스트로카토그래피와 점성술`, lead: (n) => `${n}의 아스트로카토그래피 지도, 출생 차트, 상징적 점성술 해석을 살펴보세요. 인터랙티브 차트는 아래 출생 정보를 사용합니다.`, birth: '사용한 출생 정보', date: '날짜', time: '현지 시각', place: '출생지', coords: '좌표', big4: '출생 차트의 기초', reading: (n) => `${n} 차트 해석`, live: (n) => `${n} 라이브 지도`, liveIntro: '지구본을 돌리고 행성을 바꾸며 Personality에서 출생 차트를 확인하세요. 해당 인물을 미리 불러온 실제 Natal Navigator 데모입니다.', mapReading: '이 지도 읽는 법', mapBody: (n) => `${n}의 지도는 각 출생 행성이 상승·하강·정점에 있던 장소를 보여 줍니다. 가까움은 상징적 강조를 뜻하지만 사건을 보장하지 않습니다.`, locations: '마이클 잭슨 아스트로카토그래피: 장소와 삶의 평행', locationIntro: '아래 비교는 회고적이며 점성술적 인과를 증명하지 않습니다.', sources: '전기 출처', related: '다른 유명인 차트', method: '해석 안내', methodText: '아스트로카토그래피와 점성술은 상징적 전통이며 과학적으로 검증된 인과 방법이 아닙니다. 출생 시각과 투영법이 선의 위치에 영향을 줍니다.', faqs: ['마이클 잭슨 지도는 무엇을 보여 주나?', '마이클 잭슨은 어디서 태어났나?', '이 글은 사실 전기인가?'], create: '내 지도 만들기', open: '전체 화면 열기', bornAnswer: '마이클 잭슨은 1958년 8월 29일 오후 7시 33분(CDT) 인디애나주 게리의 St. Mary’s Mercy Hospital에서 태어났습니다.', bioAnswer: '전기 날짜와 장소는 출처가 있으며, 점성술 연결은 회고적 상징 해석입니다.' },
  pl: { label: 'ASTROLOGIA CELEBRYTÓW', h1: (n) => `${n}: astrokartografia i astrologia`, lead: (n) => `Poznaj mapę astrokartograficzną, kosmogram urodzeniowy i symboliczną interpretację ${n}. Interaktywna mapa korzysta z danych urodzeniowych poniżej.`, birth: 'Użyte dane urodzeniowe', date: 'Data', time: 'Czas lokalny', place: 'Miejsce urodzenia', coords: 'Współrzędne', big4: 'Podstawa kosmogramu', reading: (n) => `${n}: interpretacja`, live: (n) => `Interaktywna mapa ${n}`, liveIntro: 'Obracaj globus, przełączaj planety i otwórz Personality, aby zobaczyć kosmogram. To prawdziwe demo Natal Navigator z wybraną osobą.', mapReading: 'Jak czytać tę mapę', mapBody: (n) => `Mapa ${n} pokazuje, gdzie każda planeta wschodziła, zachodziła lub górowała. Bliskość sugeruje symboliczny akcent, nie gwarantuje wydarzeń.`, locations: 'Astrokartografia Michaela Jacksona: miejsca i paralele życia', locationIntro: 'Porównania są retrospektywne i nie dowodzą astrologicznej przyczynowości.', sources: 'Źródła biograficzne', related: 'Inny kosmogram celebryty', method: 'Nota interpretacyjna', methodText: 'Astrokartografia i astrologia to tradycje symboliczne, a nie naukowo potwierdzone metody przyczynowe. Czas urodzenia i projekcja wpływają na linie.', faqs: ['Co pokazuje mapa Michaela Jacksona?', 'Gdzie urodził się Michael Jackson?', 'Czy to faktyczna biografia?'], create: 'Utwórz własną mapę', open: 'Otwórz pełny ekran', bornAnswer: 'Michael Jackson urodził się 29 sierpnia 1958 o 19:33 CDT w St. Mary’s Mercy Hospital w Gary w stanie Indiana.', bioAnswer: 'Daty i miejsca biograficzne są udokumentowane; związki astrologiczne to retrospektywne interpretacje symboliczne.' },
  nl: { label: 'ASTROLOGIE VAN BEROEMDHEDEN', h1: (n) => `${n}: astrocartografie en astrologie`, lead: (n) => `Bekijk de astrocartografiekaart, geboortehoroscoop en symbolische astrologische duiding van ${n}. De interactieve kaart gebruikt de geboortegegevens hieronder.`, birth: 'Gebruikte geboortegegevens', date: 'Datum', time: 'Lokale tijd', place: 'Geboorteplaats', coords: 'Coördinaten', big4: 'De basis van de geboortehoroscoop', reading: (n) => `${n}: horoscoopduiding`, live: (n) => `${n} live astrocartografiekaart`, liveIntro: 'Draai de globe, wissel planeten en open Personality voor de geboortehoroscoop. Dit is de echte Natal Navigator-demo, geladen met deze beroemdheid.', mapReading: 'Zo lees je deze kaart', mapBody: (n) => `De kaart van ${n} toont waar elke geboorteplaneet opkwam, onderging of culmineerde. Nabijheid wijst op symbolische nadruk, niet op een gegarandeerde gebeurtenis.`, locations: 'Michael Jackson astrocartografie: plaatsen en levensparallellen', locationIntro: 'De vergelijkingen zijn retrospectief en bewijzen geen astrologische causaliteit.', sources: 'Biografische bronnen', related: 'Bekijk een andere beroemdheid', method: 'Duidingsnoot', methodText: 'Astrocartografie en astrologie zijn symbolische tradities, geen wetenschappelijk bewezen causale methoden. Geboortetijd en projectie beïnvloeden de lijnen.', faqs: ['Wat toont Michael Jacksons kaart?', 'Waar werd Michael Jackson geboren?', 'Is dit een feitelijke biografie?'], create: 'Maak je eigen kaart', open: 'Open volledig scherm', bornAnswer: 'Michael Jackson werd op 29 augustus 1958 om 19:33 CDT geboren in St. Mary’s Mercy Hospital in Gary, Indiana.', bioAnswer: 'Biografische data en plaatsen zijn gedocumenteerd; astrologische verbanden zijn retrospectieve symbolische interpretaties.' },
};

const ZONES = { jackson: '19:33 CDT', musk: '07:00 SAST', diana: '19:45 BST', einstein: '11:30 local time', monroe: '09:30 PST', jobs: '19:15 PST', kahlo: '08:30 local time' };

const MICHAEL_PLACES = {
  en: [
    ['Gary 0.44° / Chicago 0.15° · Saturn MC', 'Within roughly half a degree of the Saturn-MC line around Gary and Chicago, the symbolism emphasizes discipline, duty and slow public mastery. That echoes the documented childhood rehearsal culture and the exacting work that preceded the Jackson 5’s breakthrough.'],
    ['London 0.28° / Wembley 0.43° · Moon MC', 'London lies very close to Michael’s Moon-MC line. Moon-MC symbolism concerns emotional visibility and a public bond with an audience: a useful parallel to the record-setting 1988 Wembley concerts and the planned 50-show O2 return.'],
    ['Tokyo 0.87° · Jupiter ASC', 'Tokyo sits near the Jupiter-Ascendant line. Jupiter-ASC is traditionally read as expansion of identity, reach and confidence; the Bad World Tour opened in Japan in 1987 as Michael’s solo fame entered an even larger global phase.'],
    ['Bahrain 0.91° · Uranus ASC', 'Bahrain lies near a Uranus-Ascendant line. Uranus-ASC suggests abrupt reinvention, distance from an old identity and an unconventional reset—an evocative, retrospective parallel to his period living there after the 2005 trial.'],
    ['Los Angeles 1.91° · Mars IC', 'Los Angeles is close to a Mars-IC line. Mars-IC symbolism can describe drive, pressure and restlessness in the private base. Los Angeles became both an engine of recording and performance work and the setting for the intense final This Is It rehearsals.'],
  ],
  de: [
    ['Gary 0,44° / Chicago 0,15° · Saturn MC', 'Im Raum Gary/Chicago liegt Saturn am MC innerhalb von ungefähr einem halben Grad. Symbolisch betont das Disziplin, Pflicht und langsam errungene öffentliche Meisterschaft — passend zur dokumentierten Probenkultur der Kindheit und zur harten Arbeit vor dem Durchbruch der Jackson 5.'],
    ['London 0,28° / Wembley 0,43° · Mond MC', 'London liegt sehr nah an Michael Jacksons Mond-MC-Linie. Mond am MC steht für emotionale Sichtbarkeit und Publikumsbindung: eine markante Parallele zu den rekordverdächtigen Wembley-Konzerten 1988 und der geplanten Rückkehr mit 50 O2-Shows.'],
    ['Tokio 0,87° · Jupiter AC', 'Tokio liegt nahe seiner Jupiter-Aszendent-Linie. Jupiter am AC wird als Erweiterung von Identität, Reichweite und Zuversicht gelesen; die Bad World Tour begann 1987 in Japan, als seine Solo-Berühmtheit noch globaler wurde.'],
    ['Bahrain 0,91° · Uranus AC', 'Bahrain liegt nahe einer Uranus-Aszendent-Linie. Uranus am AC kann plötzliche Neuerfindung, Distanz zur alten Identität und einen unkonventionellen Neustart anzeigen — rückblickend eine passende Parallele zu seinem Aufenthalt dort nach dem Prozess 2005.'],
    ['Los Angeles 1,91° · Mars IC', 'Los Angeles liegt nahe einer Mars-IC-Linie. Mars am IC kann Antrieb, Druck und Unruhe in der privaten Basis symbolisieren. Los Angeles war zugleich Motor seiner Studio- und Bühnenarbeit und Ort der intensiven letzten This-Is-It-Proben.'],
  ],
};

function translatedMichaelPlaces(lang) {
  if (MICHAEL_PLACES[lang]) return MICHAEL_PLACES[lang];
  const labels = {
    fr: ['discipline et maîtrise publique', 'visibilité émotionnelle et lien avec le public', 'expansion de l’identité et portée mondiale', 'réinvention soudaine et nouveau départ', 'énergie et pression dans la base privée'],
    it: ['disciplina e maestria pubblica', 'visibilità emotiva e legame col pubblico', 'espansione dell’identità e portata globale', 'reinvenzione improvvisa e nuovo inizio', 'energia e pressione nella base privata'],
    es: ['disciplina y maestría pública', 'visibilidad emocional y vínculo con el público', 'expansión de identidad y alcance global', 'reinvención repentina y reinicio', 'energía y presión en la base privada'],
    tr: ['disiplin ve kamusal ustalık', 'duygusal görünürlük ve izleyici bağı', 'kimlik ve küresel erişimin genişlemesi', 'ani yeniden icat ve yeni başlangıç', 'özel temelde enerji ve baskı'],
    ru: ['дисциплина и публичное мастерство', 'эмоциональная видимость и связь с публикой', 'расширение личности и мирового охвата', 'резкое переосмысление и перезапуск', 'энергия и давление в личной основе'],
    pt: ['disciplina e domínio público', 'visibilidade emocional e vínculo com o público', 'expansão de identidade e alcance global', 'reinvenção súbita e recomeço', 'energia e pressão na base privada'],
    ja: ['規律と公的な熟達', '感情的な可視性と観客との絆', '自己と世界的影響の拡大', '突然の再発明と再出発', '私的基盤での行動力と圧力'],
    zh: ['纪律与公众领域的精进', '情感可见度与观众连接', '身份和全球影响力的扩张', '突然的自我重塑与重启', '私人根基中的动力与压力'],
    ar: ['الانضباط والإتقان العام', 'الظهور العاطفي والرابطة مع الجمهور', 'اتساع الهوية والانتشار العالمي', 'إعادة ابتكار مفاجئة وبداية جديدة', 'الدافع والضغط في القاعدة الخاصة'],
    ko: ['규율과 공적 숙련', '감정적 가시성과 관객 유대', '정체성과 세계적 영향력의 확장', '갑작스러운 재창조와 새 출발', '사적 기반의 추진력과 압력'],
    pl: ['dyscyplina i publiczne mistrzostwo', 'emocjonalna widoczność i więź z publicznością', 'ekspansja tożsamości i globalnego zasięgu', 'nagła reinwencja i nowy początek', 'napęd i napięcie w prywatnej bazie'],
    nl: ['discipline en publiek meesterschap', 'emotionele zichtbaarheid en publieksband', 'uitbreiding van identiteit en wereldwijd bereik', 'plotselinge heruitvinding en herstart', 'drijfkracht en druk in de privébasis'],
  }[lang];
  const events = {
    fr: ['Gary/Chicago : répétitions d’enfance avant la percée des Jackson 5.', 'Londres/Wembley : concerts de 1988 et retour prévu pour 50 dates à l’O2.', 'Tokyo : le Bad World Tour débute au Japon en 1987.', 'Bahreïn : période de résidence après le procès de 2005.', 'Los Angeles : travail en studio et dernières répétitions de This Is It.'],
    it: ['Gary/Chicago: prove d’infanzia prima del successo dei Jackson 5.', 'Londra/Wembley: concerti del 1988 e ritorno previsto con 50 date alla O2.', 'Tokyo: il Bad World Tour iniziò in Giappone nel 1987.', 'Bahrain: periodo di residenza dopo il processo del 2005.', 'Los Angeles: lavoro in studio e prove finali di This Is It.'],
    es: ['Gary/Chicago: ensayos de infancia antes del éxito de los Jackson 5.', 'Londres/Wembley: conciertos de 1988 y regreso previsto con 50 fechas en el O2.', 'Tokio: el Bad World Tour comenzó en Japón en 1987.', 'Baréin: periodo de residencia tras el juicio de 2005.', 'Los Ángeles: trabajo de grabación y últimos ensayos de This Is It.'],
    tr: ['Gary/Chicago: Jackson 5 çıkışından önce çocukluk provaları.', 'Londra/Wembley: 1988 konserleri ve planlanan 50 O2 gösterisi.', 'Tokyo: Bad World Tour 1987’de Japonya’da başladı.', 'Bahreyn: 2005 davasından sonra bir süre ikamet.', 'Los Angeles: kayıt çalışmaları ve son This Is It provaları.'],
    ru: ['Гэри/Чикаго: детские репетиции до прорыва Jackson 5.', 'Лондон/Уэмбли: концерты 1988 года и запланированные 50 шоу в O2.', 'Токио: Bad World Tour начался в Японии в 1987 году.', 'Бахрейн: период проживания после суда 2005 года.', 'Лос-Анджелес: студийная работа и последние репетиции This Is It.'],
    pt: ['Gary/Chicago: ensaios na infância antes do sucesso dos Jackson 5.', 'Londres/Wembley: concertos de 1988 e retorno planejado com 50 shows na O2.', 'Tóquio: a Bad World Tour começou no Japão em 1987.', 'Bahrein: período de residência após o julgamento de 2005.', 'Los Angeles: gravações e ensaios finais de This Is It.'],
    ja: ['ゲーリー／シカゴ：ジャクソン5の成功前に続いた幼少期のリハーサル。', 'ロンドン／ウェンブリー：1988年公演と予定されていたO2での50公演。', '東京：Bad World Tourは1987年に日本で始まりました。', 'バーレーン：2005年の裁判後に滞在した時期。', 'ロサンゼルス：録音活動とThis Is It最後のリハーサル。'],
    zh: ['加里／芝加哥：Jackson 5走红前的童年排练。', '伦敦／温布利：1988年演出与原计划在O2举行的50场回归演出。', '东京：Bad World Tour于1987年在日本开启。', '巴林：2005年审判后的一段居住时期。', '洛杉矶：录音工作与This Is It最后排练。'],
    ar: ['غاري/شيكاغو: تدريبات الطفولة قبل انطلاقة Jackson 5.', 'لندن/ويمبلي: حفلات 1988 والعودة المخطط لها في 50 عرضًا في O2.', 'طوكيو: بدأت جولة Bad World Tour في اليابان عام 1987.', 'البحرين: فترة إقامة بعد محاكمة 2005.', 'لوس أنجلوس: أعمال التسجيل والبروفات الأخيرة لـ This Is It.'],
    ko: ['게리/시카고: Jackson 5 성공 전 어린 시절의 반복된 연습.', '런던/웸블리: 1988년 공연과 예정됐던 O2 50회 공연.', '도쿄: Bad World Tour가 1987년 일본에서 시작됨.', '바레인: 2005년 재판 이후 거주한 시기.', '로스앤젤레스: 녹음 작업과 This Is It 마지막 리허설.'],
    pl: ['Gary/Chicago: próby w dzieciństwie przed sukcesem Jackson 5.', 'Londyn/Wembley: koncerty w 1988 i planowany powrót na 50 występów w O2.', 'Tokio: Bad World Tour rozpoczęła się w Japonii w 1987.', 'Bahrajn: okres zamieszkania po procesie w 2005.', 'Los Angeles: nagrania i ostatnie próby This Is It.'],
    nl: ['Gary/Chicago: repetities in zijn jeugd vóór de doorbraak van Jackson 5.', 'Londen/Wembley: concerten in 1988 en de geplande terugkeer met 50 O2-shows.', 'Tokio: de Bad World Tour begon in 1987 in Japan.', 'Bahrein: een periode van verblijf na het proces van 2005.', 'Los Angeles: opnames en de laatste repetities voor This Is It.'],
  }[lang];
  const titles = ['Gary 0.44° / Chicago 0.15° · Saturn MC', 'London 0.28° / Wembley 0.43° · Moon MC', 'Tokyo 0.87° · Jupiter ASC', 'Bahrain 0.91° · Uranus ASC', 'Los Angeles 1.91° · Mars IC'];
  return titles.map((title, i) => [title, `${labels[i]}. ${events[i]}`]);
}

const SOURCES = [
  ['GRAMMY artist biography', 'https://www.grammy.com/artists/michael-jackson/13202/'],
  ['Motown Museum archive: Michael Jackson', 'https://archives.motownmuseum.org/people-acts/people-acts/active_tab/actor/item/jackson-michael-1958-2009'],
  ['Detroit Historical Society: The Jackson 5', 'https://www.detroithistorical.org/learn/online-research/encyclopedia-of-detroit/jackson-5'],
  ['Official Michael Jackson: Wembley concert', 'https://www.michaeljackson.com/en-ca/news/listen-to-the-entire-michael-jackson-wembley-stadium-concert-on-siriusxm/'],
  ['Sony Music: This Is It and the planned O2 concerts', 'https://www.sonymusic.com/sonymusic/michael-jacksons-this-is-it-to-be-presented-in-theaters-around-the-world-by-sony-pictures-entertainment-and-sony-music-entertainment/'],
  ['CBS/AP: Michael Jackson living in Bahrain', 'https://www.cbsnews.com/news/michael-jackson-makes-changes/'],
  ['Los Angeles Times: final rehearsal', 'https://www.latimes.com/la-et-jackson-rehearsal27-2009jun27-story.html'],
  ['Billboard archive: Bad World Tour chronology', 'https://www.worldradiohistory.com/Archive-Billboard/80s/1988/BB-1988-09-17.pdf'],
];

const TOP_LINES = {
  jackson: ['Sun DC', 'Moon MC', 'Jupiter ASC', 'Saturn MC'],
  musk: ['Sun ASC', 'Moon IC', 'Mercury MC', 'Mars MC'],
  diana: ['Moon MC', 'Venus DC', 'Sun DC', 'Jupiter MC'],
  einstein: ['Mercury MC', 'Jupiter ASC', 'Uranus MC', 'Sun MC'],
  monroe: ['Venus MC', 'Moon DC', 'Sun ASC', 'Neptune MC'],
  jobs: ['Mercury MC', 'Sun ASC', 'Uranus MC', 'Mars DC'],
  kahlo: ['Venus MC', 'Moon MC', 'Sun IC', 'Pluto ASC'],
};

const LINE_FOCUS = {
  en: 'Personal starting points', de: 'Persönliche Startpunkte', fr: 'Points de départ personnels', it: 'Punti di partenza personali', es: 'Puntos de partida personales', tr: 'Kişisel başlangıç noktaları', ru: 'Личные отправные точки', pt: 'Pontos de partida pessoais', ja: '個人的な注目ライン', zh: '个人重点线', ar: 'خطوط البداية الشخصية', ko: '개인별 시작선', pl: 'Osobiste punkty wyjścia', nl: 'Persoonlijke startpunten',
};

const signKey = (sign) => `s${sign}`;
const placementRows = (chart, lang) => [
  [t('pSun', lang), chart.natal.sun, '☉'],
  [t('pMoon', lang), chart.natal.moon, '☽'],
  [t('ascendant', lang), chart.natal.asc, 'AC'],
  [t('midheaven', lang), chart.natal.mc, 'MC'],
];

function renderBirth(profile, ui) {
  return `<div class="birth-grid">
    <div><span>${ui.date}</span><strong>${profile.date}</strong></div>
    <div><span>${ui.time}</span><strong>${ZONES[profile.key]}</strong></div>
    <div class="wide"><span>${ui.place}</span><strong>${profile.city}</strong></div>
    <div class="wide"><span>${ui.coords}</span><strong>${profile.lat.toFixed(6)}, ${profile.lng.toFixed(6)}</strong></div>
  </div>`;
}

function renderPlacements(chart, lang) {
  return `<div class="placement-grid">${placementRows(chart, lang).map(([label, p, glyph]) => `
    <div class="placement-card"><span class="placement-glyph">${glyph}</span><span>${label}</span><strong>${t(signKey(p.sign), lang)} ${p.deg}°${String(p.min).padStart(2, '0')}′</strong></div>`).join('')}
  </div>`;
}

function renderLive(key, name, ui) {
  const src = `/demo?embed=1&tutorial=0&star=${key}&theme=dark`;
  return `<section class="celebrity-live" id="live-chart" aria-labelledby="live-chart-title">
    <div class="celebrity-live-copy">
      <h2 id="live-chart-title">${ui.live(name)}</h2>
      <p>${ui.liveIntro}</p>
    </div>
    <div class="celebrity-live-glass">
      <div class="celebrity-live-frame">
        <div class="celebrity-live-bar">
          <span class="celebrity-live-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="celebrity-live-url">natalnavigator.com · ${ui.live(name)}</span>
          <a class="celebrity-live-open" href="/demo?star=${key}&theme=dark">${ui.open} &nearr;</a>
        </div>
        <div class="celebrity-live-body">
          <iframe src="${src}" title="${name} astrocartography and natal chart" allow="fullscreen"></iframe>
        </div>
      </div>
    </div>
    <p class="demo-actions"><a href="/demo?star=${key}&theme=dark">${ui.open} &rarr;</a> <a href="/create">${ui.create} &rarr;</a></p>
  </section>`;
}

function renderMichaelLocations(lang) {
  return `<div class="place-grid">${translatedMichaelPlaces(lang).map(([title, body]) => `<div class="place-card"><h3>${title}</h3><p>${body}</p></div>`).join('')}</div>`;
}

function renderSources() {
  return `<ul class="source-list">${SOURCES.map(([label, href]) => `<li><a href="${href}" rel="noopener noreferrer">${label}</a></li>`).join('')}</ul>`;
}

function renderRelated(currentKey, lang, ui) {
  return `<div class="celebrity-switcher">${Object.entries(CELEBRITY_PROFILES).filter(([key]) => key !== currentKey).map(([key, p]) => `<a href="${getCelebrityRoute(key, lang)}">${p.name}<span>↗</span></a>`).join('')}</div>`;
}

function faqFor(key, name, ui) {
  if (key === 'jackson') return [
    { q: ui.faqs[0], a: `${PROFILE_THEMES.jackson[ui.lang]} ${ui.methodText}` },
    { q: ui.faqs[1], a: ui.bornAnswer },
    { q: ui.faqs[2], a: ui.bioAnswer },
  ];
  return [
    { q: `${name}: ${ui.mapReading}?`, a: `${PROFILE_THEMES[key][ui.lang]} ${ui.methodText}` },
    { q: ui.method, a: ui.methodText },
  ];
}

function seoDescription(text, lang) {
  let value = lang === 'zh' ? `${text} 包含互动地图、本命盘与位置解读。` : text;
  if (value.length > 170) {
    value = value.slice(0, 166).replace(/\s+\S*$/, '').replace(/[,:;]\s*$/, '') + '.';
  }
  return value;
}

function alternatesFor(key, currentLang) {
  return Object.fromEntries(Object.entries(getCelebrityAlternates(key)).filter(([lang]) => lang !== currentLang));
}

const pages = [];
for (const lang of CELEBRITY_LANGS) {
  const ui = { ...COPY[lang], lang };
  for (const demo of DEMO_CHARTS) {
    const chart = calculateChart(demo);
    const isMichael = demo.key === 'jackson';
    const title = ui.h1(demo.name);
    const sections = [
      { h2: ui.birth, html: renderBirth(demo, ui) },
      { h2: ui.big4, html: renderPlacements(chart, lang) },
      { h2: ui.reading(demo.name), html: `<p>${PROFILE_THEMES[demo.key][lang]}</p><div class="note"><strong>${ui.method}.</strong> ${ui.methodText}</div>` },
      { h2: ui.mapReading, html: `<p>${ui.mapBody(demo.name)}</p><p><strong>${LINE_FOCUS[lang]}:</strong> ${TOP_LINES[demo.key].join(' · ')}</p>` },
    ];
    if (isMichael) {
      sections.push(
        { h2: ui.locations, html: `<p>${ui.locationIntro}</p>${renderMichaelLocations(lang)}` },
        { h2: ui.sources, html: renderSources() },
      );
    }
    sections.push({ h2: ui.related, html: renderRelated(demo.key, lang, ui) });

    pages.push({
      template: 'celebrity',
      celebrityLabel: ui.label,
      slug: getCelebritySlug(demo.key, lang),
      lang,
      title,
      ogTitle: title,
      description: seoDescription(ui.lead(demo.name), lang),
      keywords: `${demo.name} astrocartography, ${demo.name} astrology, ${demo.name} natal chart, celebrity astrocartography, celebrity astrology`,
      articleHeadline: title,
      datePublished: '2026-08-20',
      dateModified: '2026-08-20',
      breadcrumb: [{ name: ui.label, url: '/' }, { name: demo.name, url: getCelebrityRoute(demo.key, lang) }],
      h1: title,
      lead: ui.lead(demo.name),
      liveDemo: renderLive(demo.key, demo.name, ui),
      sections,
      faq: faqFor(demo.key, demo.name, ui),
      related: [],
      alt: alternatesFor(demo.key, lang),
      person: {
        name: demo.name,
        birthDate: demo.date,
        birthPlace: demo.city,
      },
    });
  }
}

export default pages;
