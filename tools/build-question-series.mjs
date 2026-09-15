import fs from 'node:fs';
import path from 'node:path';

const questions = [
  {
    slug: 'how-much-fish-food',
    date: '2026-08-21',
    displayDate: 'August 21, 2026',
    tag: 'Feeding',
    title: 'How Much Fish Food Is the Right Amount?',
    description: 'A practical guide to aquarium feeding portions, schedules, body condition, and food for bottom-feeding fish.',
    dek: 'Fish are excellent at looking hungry. The useful signals are what they actually finish, where the food lands, and whether their body condition stays healthy.',
    paragraphs: [
      'Overfeeding is one of the easiest aquarium mistakes to make because fish learn the feeding routine quickly. Many will crowd the glass five minutes after a meal. That response means they recognize an opportunity, not necessarily that they need more food.',
      'Start with only what the fish can finish in about one or two minutes. Add a small amount, watch where it goes, and adjust at the next feeding. Food still drifting or sitting on the substrate after several minutes is evidence that the portion was too large. Uneaten food eventually becomes extra waste, nitrate, and work for the filter.',
      'Most adult community fish do well with one or two small feedings per day. Juveniles may need smaller meals more often because they are growing. Rather than judging portions by begging, watch body condition over time: the goal is a fish that looks well filled out without becoming pinched or swollen.',
      'Feeding zone matters as much as quantity. Corydoras, loaches, and plecos may lose out when faster fish take everything near the surface. The answer is not to add a bigger general feeding; it is to offer sinking food that reaches the substrate when the water column is calmer. Species-specific foods also make it easier to match pellet size and ingredients to the fish.',
      'Shrimp are different again. In a mature aquarium they graze biofilm and algae throughout the day, so supplemental portions can be tiny. If food remains untouched, remove it and reduce the next serving instead of letting it decay.',
      'A reliable routine is simple: feed lightly, observe, and change one thing at a time. The right amount is the smallest portion that keeps every animal in good condition without leaving food behind.'
    ],
    boxTitle: 'Food matched to the fish',
    boxIntro: 'Choose food for the species and feeding zone rather than adding more food overall.',
    products: [
      ['https://www.amazon.ca/Hikari-Algae-Wafers-Pets-8-8-Ounce/dp/B00025K0RG/', 'Hikari Algae Wafers', 'For algae-grazing bottom feeders such as plecos.'],
      ['https://www.amazon.ca/Hikari-Sinking-Wafers-Pets-110g/dp/B00025Z6KW/', 'Hikari Sinking Wafers', 'For bottom feeders that need food delivered to the substrate.'],
      ['https://www.amazon.ca/Nutrafin-Bug-Bites-Betta-Formula/dp/B0H4XG68LV/', 'Nutrafin Bug Bites Betta Formula', 'A species-specific option for bettas.'],
      ['https://www.amazon.ca/Nutrafin-Bug-Bites-Cichlid-Formula/dp/B071KWHKNJ/', 'Fluval Bug Bites Cichlid Formula', 'A species-specific option for small to medium cichlids.']
    ]
  },
  {
    slug: 'how-much-sun-do-fish-need',
    date: '2026-08-20',
    displayDate: 'August 20, 2026',
    tag: 'Lighting',
    title: 'How Much Sun Do Fish Need?',
    description: 'Why aquarium fish need a consistent day-night rhythm rather than direct sunlight, plus a practical lighting schedule.',
    dek: 'Aquarium fish do not need a sunny window. What matters is a stable day-night rhythm and a light level the whole aquarium can use.',
    paragraphs: [
      'Direct sunlight usually creates more problems than it solves. Its intensity changes through the day, it can warm the tank unevenly, and it gives algae an energy source that is difficult to control. A tank can follow a sensible fixture schedule and still struggle if strong afternoon sun reaches the glass.',
      'Fish benefit from a consistent light-dark cycle, not sunlight specifically. Darkness gives them a predictable rest period. Leaving the aquarium bright around the clock can disrupt normal behavior, so the light should go fully dark for most of the night.',
      'Six to ten hours of aquarium lighting works for many freshwater setups. Seven or eight hours is a practical starting point for a planted tank, then the schedule can be adjusted gradually after watching plant growth and algae for several weeks. A timer is more consistent than relying on someone to remember the switch every day, and it makes each change measurable.',
      'Plants do need light for photosynthesis, but more light is not automatically better. Light, nutrients, and available carbon have to stay in balance. If plants cannot use extra light, algae often can. Increase duration or intensity only in small steps and give the aquarium time to respond.',
      'Fish do not generally require ultraviolet exposure the way some reptiles do. A few specialized species may have unusual needs, but those should be researched individually rather than treated as a universal aquarium rule.',
      'Place the tank away from direct sun, choose a repeatable fixture schedule, and preserve real darkness overnight. That controlled rhythm is safer and much easier to tune than whatever the weather sends through a window.'
    ],
    boxTitle: 'Keep aquarium lighting predictable',
    boxIntro: 'A timer controls duration; a dedicated fixture provides light without relying on a sunny window.',
    products: [
      ['https://www.amazon.ca/Coralife-5152-Digital-Power-Center/dp/B000CMKHR2/', 'Coralife Digital Power Center', 'A programmable timer for a repeatable aquarium light cycle.'],
      ['https://www.amazon.ca/SANSI-Daylight-Spectrum-Grow-Light/dp/B07BRKG7X1/', 'SANSI 40W Grow Light', 'A daylight grow light option for a planted setup; intensity and duration still need tuning.']
    ]
  },
  {
    slug: 'what-happened-to-my-shrimps-skin',
    date: '2026-08-19',
    displayDate: 'August 19, 2026',
    tag: 'Shrimp care',
    title: 'What Happened to My Shrimp’s Skin?',
    description: 'How to recognize a normal shrimp molt, understand the vulnerable period afterward, and investigate repeated molt trouble.',
    dek: 'A hollow shrimp shape on the substrate is often a successful molt, not a dead shrimp. The difference is easier to see once you know what to inspect.',
    media: {
      src: '/assets/media/shrimp-moss-grazing.mp4',
      poster: '/assets/media/shrimp-moss-grazing-poster.webp',
      label: 'Shrimp grazing across aquarium moss',
      duration: 'PT8.07S',
      caption: 'A shrimp grazing across moss and planted hardscape.'
    },
    paragraphs: [
      'Shrimp wear an exoskeleton that cannot stretch as they grow. They periodically form a softer shell underneath, split the old shell, and wriggle free. The discarded shell, called an exuvia, can preserve the legs and antennae so perfectly that it looks alarming at first glance.',
      'A molt is usually translucent, papery, and hollow. A dead shrimp keeps body tissue and often retains more colour. When the object is clearly an empty shell, it can stay in the aquarium: shrimp and tankmates may eat it and recycle some of its minerals.',
      'The newly molted shrimp will be soft and vulnerable until its shell hardens. Hiding for a while is normal, so avoid moving décor or chasing it out for a closer look. Stable conditions and adequate cover are more helpful than intervention.',
      'General hardness matters because calcium and other minerals contribute to shell formation. Sudden changes in GH, KH, temperature, or pH can be stressful, especially after poor acclimation. A test result is useful context, but one successful or failed molt should not be diagnosed from a single number.',
      'A pale ring around the body can simply be the place where the old shell will separate. The stronger warning is a pattern: multiple shrimp struggling or dying around molts, particularly after a recent water change or parameter swing. That is when testing and reviewing the timeline becomes important.',
      'Habitat materials such as leaf litter, porous wood, and shrimp substrate add cover and grazing surfaces. They are useful habitat choices, not proven treatments for failed molts, so keep the claim modest and focus first on stable, species-appropriate water.'
    ],
    boxTitle: 'Testing and shrimp habitat',
    boxIntro: 'Use testing to understand hardness, and treat habitat products as cover and grazing surfaces rather than molt cures.',
    products: [
      ['https://www.amazon.ca/API-TEST-Freshwater-Aquarium-Water/dp/B003SNCHMA/', 'API GH & KH Test Kit', 'Measures general and carbonate hardness.'],
      ['https://www.amazon.ca/Fluval-Plant-Shrimp-Stratum-4-4/dp/B00JGQIY48/', 'Fluval Plant & Shrimp Stratum', 'A planted-aquarium substrate marketed for plants and shrimp.'],
      ['https://www.amazon.ca/s?k=30+piece+indian+almond+leaves+aquarium', 'Indian Almond Leaves', 'Leaf litter that adds cover and grazing surfaces.'],
      ['https://www.amazon.ca/s?k=Corhad+cholla+wood', 'Cholla Wood', 'Porous cover with additional surface area for biofilm.']
    ]
  },
  {
    slug: 'why-is-my-fish-staying-at-the-bottom',
    date: '2026-08-18',
    displayDate: 'August 18, 2026',
    tag: 'Troubleshooting',
    title: 'Why Is My Fish Staying at the Bottom of the Tank?',
    description: 'A step-by-step way to tell normal bottom-dwelling behavior from water-quality, temperature, oxygen, or health trouble.',
    dek: 'Bottom-sitting means very different things for a corydoras and a normally active mid-water fish. Start with the species, then check the environment.',
    paragraphs: [
      'Some fish belong near the bottom. Corydoras search the substrate, loaches shelter low, and plecos spend long periods attached to hard surfaces. Concern starts when a fish changes from its normal position or combines bottom-sitting with other symptoms.',
      'Test ammonia and nitrite first because either can be dangerous in water that looks perfectly clear. Check nitrate and pH for context, then verify temperature with a reliable reading. Water that is too cool can slow a fish down, while overly warm water holds less dissolved oxygen and raises metabolic demand.',
      'A new arrival may hide low after transport and acclimation. Give it cover, subdued activity around the tank, and time to settle while still monitoring the basics. Stress alone can explain temporary withdrawal, but it should not be used to dismiss worsening breathing or balance problems.',
      'Look for rapid gill movement, clamped fins, loss of appetite, spots, fading colour, erratic swimming, or separation from a social group. A cluster of signs is more informative than bottom position alone. Record what changed recently, including maintenance, feeding, livestock, temperature, and equipment.',
      'Check the filter outlet and surface movement. Reduced flow from a clogged intake or stalled air pump can lower oxygen exchange. If water and equipment checks point toward oxygenation, supplemental aeration can help while the cause is corrected; it is not a substitute for resolving ammonia, heat, or disease.',
      'Avoid choosing medication from one vague symptom. Testing and observation narrow the problem without adding unnecessary treatment stress. The smallest safe response is usually to stabilize the environment first, keep notes, and escalate only when the evidence supports it.'
    ],
    boxTitle: 'If checks point toward oxygenation',
    boxIntro: 'Test first. These tools support water checks and gentle aeration while the underlying cause is addressed.',
    products: [
      ['https://www.amazon.ca/API-FRESHWATER-800-Test-Freshwater-Aquarium/dp/B000255NCI/', 'API Freshwater Master Test Kit', 'Checks ammonia, nitrite, nitrate, and pH during troubleshooting.'],
      ['https://www.amazon.ca/Hikari-Aquarium-Solutions-Bacto-Filter/dp/B00GOFRZIU/', 'Hikari Bacto-Surge Sponge Filter', 'Gentle supplemental filtration and aeration when paired with an air pump.'],
      ['https://www.amazon.ca/Tetra-77852-Whisper-Pump-20-Gallon/dp/B00B39POAI/', 'Tetra Whisper 20 Air Pump', 'An air source for a small sponge-filter or air-stone setup.']
    ]
  },
  {
    slug: 'why-is-my-fish-swimming-at-the-top',
    date: '2026-08-17',
    displayDate: 'August 17, 2026',
    tag: 'Aeration',
    title: 'Why Is My Fish Swimming at the Top of the Tank?',
    description: 'How to distinguish normal surface behavior from gasping and respond to oxygen, temperature, water-quality, or equipment problems.',
    dek: 'The key question is whether the fish is calmly using the surface or repeatedly gasping there. One can be normal; the other needs prompt investigation.',
    paragraphs: [
      'Some species naturally feed, explore, or hold territory near the surface. A fish that remains active, eats normally, and shows healthy colour may simply be using its preferred part of the aquarium. Rapid gulping, especially from several fish at once, changes the picture.',
      'Oxygen enters aquarium water mainly through gas exchange at the surface. A clogged intake, weak filter outlet, or still surface can reduce that exchange. Warm water holds less dissolved oxygen, so a warm, crowded aquarium can become risky faster than a cool, lightly stocked one.',
      'Check ammonia and nitrite because both can affect breathing even when oxygen appears adequate. Verify temperature and inspect every piece of circulation equipment. If injected CO₂ is running, reduce or stop it while investigating; excessive CO₂ can also drive fish to the surface.',
      'When several fish are gasping, increase surface movement promptly with an air stone or correctly positioned filter outlet while testing the water. Supplemental aeration buys time, but it does not remove ammonia, lower an unsafe temperature, or repair failed equipment.',
      'An air pump setup needs tubing, an air stone or sponge filter, and a check valve when the pump sits below the water line. The valve helps prevent back-siphoning during a power outage. Match the pump to the depth and number of devices rather than assuming more airflow is always better.',
      'Once the immediate behavior settles, find the reason it happened. Cleaning a blocked intake, reducing excess heat, correcting water quality, or lowering stocking pressure prevents a repeat; leaving an extra air stone running without addressing the cause only hides the warning.'
    ],
    boxTitle: 'Emergency aeration setup',
    boxIntro: 'Use supplemental aeration while diagnosing the water-quality or equipment problem.',
    products: [
      ['https://www.amazon.ca/Tetra-77852-Whisper-Pump-20-Gallon/dp/B00B39POAI/', 'Tetra Whisper 20 Air Pump', 'Compact aeration for aquariums within the manufacturer’s rating.'],
      ['https://www.amazon.ca/Tetra-77853-Whisper-Pump-40-Gallon/dp/B0009YF4FI/', 'Tetra Whisper 40 Air Pump', 'A higher-capacity option for a larger or deeper setup.'],
      ['https://www.amazon.ca/dp/B073PZ6QNB/', 'Pawfly Aquarium Check Valves', 'One-way valves that help protect an air pump from back-siphoning.'],
      ['https://www.amazon.ca/Hikari-Aquarium-Solutions-Bacto-Filter/dp/B00GOFRZIU/', 'Hikari Bacto-Surge Sponge Filter', 'Gentle filtration and aeration when paired with an air pump.']
    ]
  },
  {
    slug: 'how-often-should-you-change-aquarium-water',
    date: '2026-08-16',
    displayDate: 'August 16, 2026',
    tag: 'Maintenance',
    title: 'How Often Should You Change Aquarium Water?',
    description: 'How to set a water-change schedule from nitrate trends, stocking, feeding, plants, and the sensitivity of aquarium inhabitants.',
    dek: 'There is no universal water-change percentage. A useful schedule is based on what accumulates in this aquarium and how stable replacement water can be.',
    paragraphs: [
      'Filtration processes waste but does not make every dissolved compound disappear. Fish waste, leftover food, and biological activity continue to add material until plants use it or maintenance removes it. Water changes dilute that accumulation and replenish some minerals.',
      'Twenty to thirty percent weekly is a reasonable starting point for many community tanks, not a rule. Test nitrate at a consistent point in the schedule and watch the trend. A rapid rise can point to heavy stocking, excess feeding, decaying material, or insufficient plant uptake.',
      'Bigger changes are not automatically better. Shrimp and other sensitive animals can react poorly to abrupt differences in temperature, GH, KH, or pH. Smaller, more frequent changes may be easier on them, and replacement water should be matched as closely as practical.',
      'Substrate cleaning depends on the layout. A bare-bottom or lightly planted tank makes debris easy to remove, while a densely planted aquarium should not have every rooted area disturbed on a schedule. Siphon visible waste and leave healthy root zones intact.',
      'Water changes do not remove the aquarium cycle. Most beneficial bacteria live on filter media, substrate, plants, and hardscape rather than floating in the water. The greater risk is replacing or sterilizing all mature filter media at once.',
      'Keep a simple log of volume, test results, and anything unusual. Test before the change and again at the same point in the next cycle so the comparison is meaningful. Note the replacement-water temperature and volume too, because repeatable inputs make changing trends easier to interpret. Adjust gradually when the trend calls for it. Consistency is more useful than waiting for a visible problem and then making a dramatic correction.'
    ],
    boxTitle: 'Related aquarium maintenance',
    boxIntro: 'Testing helps match replacement water; bottled bacteria is for relevant setup or recovery situations, not every routine change.',
    products: [
      ['https://www.amazon.ca/API-TEST-Freshwater-Aquarium-Water/dp/B003SNCHMA/', 'API GH & KH Test Kit', 'Useful when comparing hardness between aquarium and replacement water.'],
      ['https://www.amazon.ca/Seachem-116012608-Stability-1-Litre/dp/B0002568VC/', 'Seachem Stability, 1 L', 'A bottled bacteria product for relevant setup or recovery situations.']
    ]
  },
  {
    slug: 'why-is-my-aquarium-water-cloudy',
    date: '2026-08-15',
    displayDate: 'August 15, 2026',
    tag: 'Water quality',
    title: 'Why Is My Aquarium Water Cloudy?',
    description: 'How to distinguish bacterial blooms, green water, tannins, and suspended substrate before choosing a response.',
    dek: 'Cloudy water is a description, not a diagnosis. Its colour, timing, and the change that came immediately before it usually reveal the useful next step.',
    paragraphs: [
      'A white or gray haze in a new aquarium is often a bacterial bloom while the microbial community settles. It can look dramatic and still clear on its own. Test ammonia and nitrite during the bloom because appearance cannot tell you whether the water is safe.',
      'Green water comes from free-floating algae and points toward available light and nutrients. Brown or tea-coloured water may be tannins released by wood or leaves. Fine substrate can also create a dusty cloud after planting or maintenance, especially if it was recently disturbed.',
      'Work backward before buying a cure. Ask whether the tank was just started, the filter was deep-cleaned, feeding increased, substrate or wood was added, or several fish arrived. The timing often identifies the cause more reliably than the colour alone.',
      'Avoid tearing down the aquarium or replacing all filter media in response to a haze. That can remove established biological capacity and create a larger problem. Preserve mature media, correct the identified source, and use partial water changes when testing or livestock condition supports them.',
      'Bottled bacteria may be relevant when establishing or rebuilding biological filtration, and an additional sponge filter can add biological and mechanical capacity. Neither product is a guaranteed cloudy-water cure because neither addresses every possible cause.',
      'Treat gasping, lethargy, or measurable ammonia and nitrite as urgent. Otherwise, document the change, keep testing, and give an ordinary bacterial bloom time to settle instead of stacking several interventions at once. Clear photographs taken under the same lighting can also show whether visibility is improving from day to day without relying on memory alone.'
    ],
    boxTitle: 'Support the setup, not a mystery cure',
    boxIntro: 'Use products only when they match the cause you identified.',
    products: [
      ['https://www.amazon.ca/Seachem-116012608-Stability-1-Litre/dp/B0002568VC/', 'Seachem Stability, 1 L', 'Bottled bacteria that may be relevant when establishing biological filtration.'],
      ['https://www.amazon.ca/Hikari-Aquarium-Solutions-Bacto-Filter/dp/B00GOFRZIU/', 'Hikari Bacto-Surge Sponge Filter', 'Additional biological and mechanical filtration when the setup calls for it.']
    ]
  },
  {
    slug: 'is-my-aquarium-filter-big-enough',
    date: '2026-08-14',
    displayDate: 'August 14, 2026',
    tag: 'Filtration',
    title: 'How Do I Know If My Aquarium Filter Is Big Enough?',
    description: 'How to judge aquarium filtration by biological capacity, real-world flow, debris, stocking, and the needs of fish and shrimp.',
    dek: 'A filter’s box rating is only a starting point. Biological capacity, actual flow, maintenance, and livestock comfort matter more than chasing the largest GPH.',
    paragraphs: [
      'Published flow rates are measured under cleaner, simpler conditions than most working aquariums. Media, tubing, head height, and buildup reduce real flow. Turnover is useful for comparing options, but it is not proof that a filter will suit a particular community.',
      'More flow can be a problem for shrimp, small fish, and long-finned species. The goal is circulation that avoids stagnant areas while still letting livestock feed and rest comfortably. A spray bar, baffle, or sponge filter can spread flow more gently.',
      'Biological capacity is the surface area where beneficial bacteria process ammonia and nitrite. Mechanical media catches debris, but it only removes that waste from the system when the media is rinsed or replaced appropriately. Both functions matter, and both decline when a filter is allowed to clog.',
      'Persistent debris, weak circulation, rapidly clogging media, and repeated water-quality trouble can indicate inadequate filtration. They can also indicate overfeeding or overstocking, so review husbandry before solving every problem with a larger filter.',
      'A sponge filter provides gentle biological and mechanical filtration and is useful for shrimp or small fish. It needs an air pump, airline, and usually a check valve when the pump sits below the aquarium water level. Match each component to the intended setup.',
      'Choose filtration around adult stocking, feeding load, and the animals’ preferred flow. Check the outlet during routine maintenance so gradual flow loss does not go unnoticed, and rinse reusable media in removed aquarium water when it needs cleaning. A correctly maintained modest filter can outperform a larger neglected one, and no filter can create swimming room or make an overloaded community comfortable.'
    ],
    boxTitle: 'A simple sponge-filtration setup',
    boxIntro: 'Match biological capacity and flow to the livestock rather than buying by GPH alone.',
    products: [
      ['https://www.amazon.ca/Hikari-Aquarium-Solutions-Bacto-Filter/dp/B00GOFRZIU/', 'Hikari Bacto-Surge Sponge Filter', 'Gentle biological and mechanical filtration for shrimp and small fish.'],
      ['https://www.amazon.ca/Tetra-77852-Whisper-Pump-20-Gallon/dp/B00B39POAI/', 'Tetra Whisper 20 Air Pump', 'An air source for a small sponge-filter setup.'],
      ['https://www.amazon.ca/dp/B073PZ6QNB/', 'Pawfly Aquarium Check Valves', 'Back-siphon protection for standard aquarium airline.'],
      ['https://www.amazon.ca/s?k=3%2F16+aquarium+airline+tubing', '3/16-inch Aquarium Airline Tubing', 'Tubing for connecting the pump, valve, and sponge filter.']
    ]
  },
  {
    slug: 'how-many-fish-can-i-put-in-my-aquarium',
    date: '2026-08-13',
    displayDate: 'August 13, 2026',
    tag: 'Stocking',
    title: 'How Many Fish Can I Put in My Aquarium?',
    description: 'A better aquarium stocking method based on adult size, social groups, territory, swimming space, waste, and filtration.',
    dek: 'Fish are not interchangeable inches. A sustainable stocking plan starts with adult size and behavior, then checks space, social needs, and biological demand.',
    paragraphs: [
      'The one-inch-per-gallon rule ignores body mass, activity, waste, and shape. A slender one-inch tetra and a deep-bodied six-inch fish do not scale as equivalent units. Use the rule only as a reminder to research, never as permission to buy.',
      'Plan around adult size rather than the juvenile in the store. Check the footprint and swimming length the species needs, not only the tank’s volume. Active open-water fish may need a longer aquarium, while territorial species need enough structure and separate areas.',
      'Social requirements can set the minimum before bioload does. Many tetras, rasboras, and corydoras behave more naturally in suitable groups. Fewer species kept in proper groups often produce a calmer aquarium than pairs and trios of many different fish.',
      'Filtration processes waste but cannot create swimming room, stop incompatible fish from fighting, or meet a schooling need. Plants and hardscape help break sightlines and provide cover, yet they also occupy physical space. Consider the finished layout, not an empty glass box.',
      'Add livestock gradually and test ammonia and nitrite after meaningful changes. A mature sponge filter adds biological capacity, but it does not make unlimited stocking safe. Leave room for growth and for the aquarium to absorb an ordinary maintenance delay without becoming unstable.',
      'The better question is not how many fish can physically fit. It is which complete community can live there long term with appropriate groups, territories, water parameters, flow, and maintenance. Write the full adult stocking plan before the first purchase so later additions are deliberate and compatible overall. A slightly understocked tank is usually more resilient and easier to enjoy.'
    ],
    boxTitle: 'Before you stock the tank',
    boxIntro: 'Testing and established filtration help verify readiness; they do not override adult size or compatibility.',
    products: [
      ['https://www.amazon.ca/API-FRESHWATER-800-Test-Freshwater-Aquarium/dp/B000255NCI/', 'API Freshwater Master Test Kit', 'Checks ammonia and nitrite as biological demand changes.'],
      ['https://www.amazon.ca/Hikari-Aquarium-Solutions-Bacto-Filter/dp/B00GOFRZIU/', 'Hikari Bacto-Surge Sponge Filter', 'A gentle biological filter option for an appropriately sized setup.']
    ]
  },
  {
    slug: 'why-are-my-aquarium-plants-turning-brown',
    date: '2026-08-12',
    displayDate: 'August 12, 2026',
    tag: 'Plants',
    title: 'Why Are My Aquarium Plants Turning Brown?',
    description: 'How to separate normal plant transition from algae, nutrient, light, substrate, or carbon problems in a planted aquarium.',
    dek: 'Brown leaves do not automatically mean a plant is dying. New growth, leaf texture, and recent changes tell a more useful story than colour alone.',
    paragraphs: [
      'Many nursery plants are grown with their leaves above water. After planting underwater, that emersed growth may deteriorate while submerged leaves develop. Cryptocoryne can melt dramatically after a move and still regrow from healthy roots once conditions stabilize.',
      'Look at the newest leaves. Healthy new growth alongside declining older leaves usually points to adaptation. If both old and new growth deteriorate, inspect light, nutrients, carbon availability, roots, and temperature rather than assuming the plant simply needs more light.',
      'Light, nutrients, and carbon interact. Increasing light without enough usable nutrients or carbon may accelerate algae instead of plant growth. Begin with a repeatable schedule, make one measured adjustment, and wait long enough to see the response.',
      'Substrate matters most for plants that feed heavily through their roots, while water-column feeders rely more on nutrients available around their leaves. A planted substrate can support a new setup or planned rescape, but replacing substrate is not a sensible first response to one brown leaf.',
      'Low-tech aquariums can grow many healthy plants without injected CO₂. If injected CO₂ is used, a drop checker offers a visual indication of concentration; it does not directly measure every condition in the tank. Liquid carbon products should also be used according to their label rather than treated as fertilizer for every deficiency.',
      'Finally, check whether the brown material wipes away. A dusty coating may be diatoms or other algae on a healthy leaf, which is different from soft, transparent, dying tissue. Trim fully decomposed growth, preserve healthy roots and growing points, and judge recovery by what the plant produces next over time.'
    ],
    boxTitle: 'Tools for a planted setup',
    boxIntro: 'These products support specific setups; they do not replace diagnosing the balance of light, nutrients, carbon, and algae.',
    products: [
      ['https://www.amazon.ca/Coralife-5152-Digital-Power-Center/dp/B000CMKHR2/', 'Coralife Digital Power Center', 'Maintains a repeatable lighting schedule.'],
      ['https://www.amazon.ca/Fluval-Plant-Shrimp-Stratum-4-4/dp/B00JGQIY48/', 'Fluval Plant & Shrimp Stratum', 'A planted-aquarium substrate for new setups or planned rescapes.'],
      ['https://www.amazon.ca/Pawfly-Aquarium-Checker-Planted-Indicator/dp/B07ZNLZ3Y2/', 'Pawfly Glass CO₂ Drop Checker', 'A visual indicator for an aquarium already using injected CO₂.'],
      ['https://www.amazon.ca/Seachem-67104530-Flourish-Excel-500ml/dp/B000256962/', 'Seachem Flourish Excel, 500 mL', 'A liquid carbon product to use only as directed for a suitable planted setup.']
    ]
  }
];

const fonts = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
const csp = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'; upgrade-insecure-requests";
const relatedQuestionSlugs = {
  'how-much-fish-food': ['why-is-my-aquarium-water-cloudy', 'how-often-should-you-change-aquarium-water'],
  'how-much-sun-do-fish-need': ['why-are-my-aquarium-plants-turning-brown', 'why-is-my-aquarium-water-cloudy'],
  'what-happened-to-my-shrimps-skin': ['how-often-should-you-change-aquarium-water', 'how-many-fish-can-i-put-in-my-aquarium'],
  'why-is-my-fish-staying-at-the-bottom': ['why-is-my-fish-swimming-at-the-top', 'why-is-my-aquarium-water-cloudy'],
  'why-is-my-fish-swimming-at-the-top': ['is-my-aquarium-filter-big-enough', 'why-is-my-fish-staying-at-the-bottom'],
  'how-often-should-you-change-aquarium-water': ['why-is-my-aquarium-water-cloudy', 'what-happened-to-my-shrimps-skin'],
  'why-is-my-aquarium-water-cloudy': ['how-often-should-you-change-aquarium-water', 'is-my-aquarium-filter-big-enough'],
  'is-my-aquarium-filter-big-enough': ['why-is-my-fish-swimming-at-the-top', 'how-many-fish-can-i-put-in-my-aquarium'],
  'how-many-fish-can-i-put-in-my-aquarium': ['is-my-aquarium-filter-big-enough', 'how-often-should-you-change-aquarium-water'],
  'why-are-my-aquarium-plants-turning-brown': ['how-much-sun-do-fish-need', 'why-is-my-aquarium-water-cloudy']
};

function renderProducts(question) {
  return question.products.map(([href, name, note]) =>
    `                <li><a data-amazon-link href="${href}" target="_blank" rel="noopener noreferrer"><span class="product-box__name">${name}</span></a><span class="product-box__note">${note}</span></li>`
  ).join('\n');
}

function renderRelatedGuides(question) {
  const related = relatedQuestionSlugs[question.slug].map((slug) => {
    const relatedQuestion = questions.find((candidate) => candidate.slug === slug);
    if (!relatedQuestion) throw new Error(`Unknown related question: ${slug}`);
    return `                <li><a href="/journal/${slug}/">${relatedQuestion.title}</a></li>`;
  }).join('\n');
  return `          <aside class="related-guides" aria-labelledby="${question.slug}-related">
            <h2 id="${question.slug}-related">Related aquarium guides</h2>
            <ul>
${related}
            </ul>
          </aside>`;
}

function renderArticle(question) {
  const canonical = `https://glassgardenfins.com/journal/${question.slug}/`;
  const paragraphs = question.paragraphs.map((paragraph, index) => {
    const rendered = [`            <p>${paragraph}</p>`];
    if (index === 1 && question.media) {
      rendered.push(`            <figure class="site-media entry-media">
              <video controls playsinline preload="metadata" poster="${question.media.poster}" aria-label="${question.media.label}" data-duration="${question.media.duration}">
                <source src="${question.media.src}" type="video/mp4">
                Your browser does not support embedded video.
              </video>
              <figcaption>${question.media.caption}</figcaption>
            </figure>`);
    }
    if (index === 3) {
      rendered.push(`
            <aside class="product-box" aria-labelledby="${question.slug}-products">
              <h2 id="${question.slug}-products">${question.boxTitle}</h2>
              <p>${question.boxIntro}</p>
              <ul class="product-box__list">
${renderProducts(question)}
              </ul>
            </aside>`);
    }
    return rendered.join('\n');
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${question.title} — Glass Garden Fins</title>
<meta name="description" content="${question.description}">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="amazon-associate-tag" content="">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${question.title} — Glass Garden Fins">
<meta property="og:description" content="${question.description}">
<meta name="twitter:card" content="summary">
<meta name="twitter:url" content="${canonical}">
<meta name="twitter:title" content="${question.title} — Glass Garden Fins">
<meta name="twitter:description" content="${question.description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<a class="skip-link" href="#top">Skip to content</a>
<header class="site-header">
  <div class="wrap site-header__inner">
    <a href="/" class="wordmark">Glass Garden Fins</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/tank/">The Tank</a>
      <a href="/journal/" aria-current="page">Journal</a>
    </nav>
  </div>
</header>
<main id="top" class="page-main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow"><a class="eyebrow__link" href="/journal/">Journal</a> · ${question.tag}</p>
      <h1 class="section-title section-title--compact">${question.title}</h1>
      <p class="page-hero__lead">${question.description}</p>
    </div>
  </section>
  <section class="journal">
    <div class="wrap">
      <div class="entries">
        <article class="entry entry--feature">
          <div class="entry__meta">
            <span class="entry__tag">${question.tag}</span>
            <time class="entry__date" datetime="${question.date}">${question.displayDate}</time>
          </div>
          <p class="entry__dek">${question.dek}</p>
          <p class="affiliate-disclosure" data-affiliate-disclosure hidden>As an Amazon Associate, Glass Garden Fins earns from qualifying purchases. Product links are selected for relevance; purchases made through them may earn the site a commission at no extra cost to you.</p>
${paragraphs}
${renderRelatedGuides(question)}
          <p class="entry__closing"><a href="/journal/10-aquarium-questions/">Browse all ten aquarium questions</a> or return to the <a href="/journal/">full journal archive</a>.</p>
        </article>
      </div>
    </div>
  </section>
  <nav class="page-nav page-nav--subpage" aria-label="Explore more">
    <div class="wrap">
      <ul class="page-nav__list">
        <li><a class="page-nav__link" href="/journal/"><span class="page-nav__title">Journal</span><span class="page-nav__desc">Browse every dated entry, newest first.</span></a></li>
        <li><a class="page-nav__link" href="/tank/"><span class="page-nav__title">The Tank</span><span class="page-nav__desc">Review the current aquarium setup and livestock.</span></a></li>
      </ul>
    </div>
  </nav>
</main>
<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <p>Glass Garden Fins — a planted tank log, updated as the tank changes.</p>
    <a href="#top" class="back-to-top">Back to top ↑</a>
  </div>
</footer>
<script src="/script.js"></script>
</body>
</html>
`;
}

function renderSeriesIndex() {
  const canonical = 'https://glassgardenfins.com/journal/10-aquarium-questions/';
  const cards = questions.map((question, index) => `        <article class="journal-card">
          <a class="journal-card__link" href="/journal/${question.slug}/">
            <div class="entry__meta">
              <span class="entry__tag">Question ${index + 1}</span>
              <time class="entry__date" datetime="${question.date}">${question.displayDate}</time>
            </div>
            <h2 class="journal-card__title">${question.title}</h2>
          </a>
        </article>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>10 Aquarium Questions — Glass Garden Fins</title>
<meta name="description" content="Ten practical aquarium guides on feeding, lighting, shrimp molts, fish behavior, water changes, cloudy water, filtration, stocking, and plants.">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="10 Aquarium Questions — Glass Garden Fins">
<meta property="og:description" content="Ten practical aquarium questions, each answered in its own focused journal entry.">
<meta name="twitter:card" content="summary">
<meta name="twitter:url" content="${canonical}">
<meta name="twitter:title" content="10 Aquarium Questions — Glass Garden Fins">
<meta name="twitter:description" content="Ten practical aquarium questions, each answered in its own focused journal entry.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<a class="skip-link" href="#top">Skip to content</a>
<header class="site-header">
  <div class="wrap site-header__inner">
    <a href="/" class="wordmark">Glass Garden Fins</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/tank/">The Tank</a>
      <a href="/journal/" aria-current="page">Journal</a>
    </nav>
  </div>
</header>
<main id="top" class="page-main journal-index-page">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow"><a class="eyebrow__link" href="/journal/">Journal</a> · Guide series</p>
      <h1 class="section-title section-title--compact">10 Aquarium Questions</h1>
      <p class="page-hero__lead">The original guide is now ten focused entries. Select a question to read its complete answer and contextual equipment suggestions.</p>
    </div>
  </section>
  <section class="journal journal--index">
    <div class="wrap">
      <div class="journal-grid">
${cards}
      </div>
    </div>
  </section>
  <nav class="page-nav page-nav--subpage" aria-label="Explore more">
    <div class="wrap">
      <ul class="page-nav__list">
        <li><a class="page-nav__link" href="/journal/"><span class="page-nav__title">Journal</span><span class="page-nav__desc">Browse the complete dated archive.</span></a></li>
        <li><a class="page-nav__link" href="/tank/"><span class="page-nav__title">The Tank</span><span class="page-nav__desc">Review the current aquarium setup and livestock.</span></a></li>
      </ul>
    </div>
  </nav>
</main>
<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <p>Glass Garden Fins — a planted tank log, updated as the tank changes.</p>
    <a href="#top" class="back-to-top">Back to top ↑</a>
  </div>
</footer>
<script src="/script.js"></script>
</body>
</html>
`;
}

const repoRoot = process.cwd();
for (const question of questions) {
  const outputDir = path.join(repoRoot, 'journal', question.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderArticle(question));
}
fs.writeFileSync(
  path.join(repoRoot, 'journal', '10-aquarium-questions', 'index.html'),
  renderSeriesIndex()
);

console.log(`Built ${questions.length} standalone aquarium-question entries and their series index.`);
