export const ROOMS = {
  outer_wall: {
  title: "Outer Wall",
  gridPosition: { col: 0, row: 1 },
  media: "outer_wall",
  fx: "mist",

  baseDescription:
    "Rain lashes the outer wall of the shogun's mountain castle. Near the base of the wet stonework, a small breach hides in shadow — just wide enough to crawl through.",

  itemText: {},

  states: {
    default: {
      description:
        "Rain lashes the outer wall of the shogun's mountain castle. Near the base of the wet stonework, a small breach hides in shadow — just wide enough to crawl through.",
      fx: "mist",
      media: "outer_wall",
    },
  },

  mediaStates: [],
  enterRequires: null,
  exits: {},
  hazards: [],

  actions: [
    {
      verbs: ["crawl", "squeeze", "sneak", "slip", "climb", "go", "enter", "move", "creep", "crouch"],
      targets: ["opening", "gap", "crack", "hole", "breach", "wall", "stones", "courtyard", "inside", "through"],
      requires: null,
      requiresText: null,
      condition: null,
      successText:
        "You drop low, scrape through the narrow breach, and slip into the inner courtyard with rainwater running down your sleeves.",
      effects: {
        goTo: "courtyard",
      },
    },
  ],

  objects: {
    broken_ladder: {
      id: "broken_ladder",
      aliases: ["ladder", "broken ladder", "wooden ladder"],
      examineText:
        "The ladder is split and useless. Whoever came before you climbed the stone itself.",
      useText: "The ladder breaks further under your hand.",
    },

    wall_stones: {
      id: "wall_stones",
      aliases: ["stones", "wall", "broken stones", "stonework", "opening", "crack", "gap", "breach", "hole"],
      examineText:
        "Several stones have collapsed inward, leaving a narrow breach just wide enough to squeeze through. The edges are rough, wet, and dark with rain.",
      useText:
        "You flatten yourself and squeeze through the breach.",
    },
  },

  flavourTargets: {
    opening: {
      id: "opening",
      aliases: ["opening", "gap", "crack", "hole", "breach", "way in", "way through"],
      examineText:
        "The gap in the wall is just wide enough. The stones around it are slick with rain. You could squeeze through if you tried.",
    },

    mud_path: {
      id: "mud_path",
      aliases: ["mud", "path", "ground", "trail"],
      examineText:
        "Fresh mud has been pressed flat by careful footsteps leading toward the breach.",
    },

    lantern_glow: {
      id: "lantern_glow",
      aliases: ["light", "glow", "lantern light"],
      examineText:
        "Warm lantern light flickers somewhere beyond the broken wall.",
    },

    rain_tiles: {
      id: "rain_tiles",
      aliases: ["tiles", "roof", "rain"],
      examineText:
        "Rainwater streams down the black roof tiles like flowing ink.",
    },

    claw_marks: {
      id: "claw_marks",
      aliases: ["marks", "scratches", "claw marks"],
      examineText:
        "Old climbing scars cut into the stone. Someone used this route before you.",
    },

    banner: {
      id: "banner",
      aliases: ["banner", "flag", "crest"],
      examineText:
        "The shogun's crest hangs motionless despite the storm.",
    },
  },

  win: false,
},

  courtyard: {
  title: "Inner Courtyard",
  gridPosition: { col: 1, row: 1 },
  media: "courtyard_default",
  fx: "mist",
  deathMedia: "death_guard",

  baseDescription:
    "Rainwater glistens across the open courtyard stones. Guards patrol beneath swinging lanterns while ceremonial smoke drifts from the main hall to the east.\n\nA watch tower overlooks the grounds to the north. A narrow servant corridor disappears south between the wooden buildings. The broken outer wall lies west.",

  itemText: {},

  states: {
    default: {
      description:
        "Rainwater glistens across the open courtyard stones. Guards patrol beneath swinging lanterns while ceremonial smoke drifts from the main hall to the east.",
      fx: "mist",
      media: "courtyard_default",
    },

    alerted: {
      description:
        "The courtyard is alive with alarm. Guards sweep the rain with raised lanterns while bells echo through the castle.",
      fx: "flicker",
      media: "courtyard_alerted",
    },

    smoke_covered: {
      description:
        "Pale smoke rolls low across the courtyard stones. Guards stumble through the haze with lanterns raised, shouting blindly into the storm.",
      fx: "mist",
      media: "courtyard_smoke",
    },
  },

  mediaStates: [
    { condition: { flag: "castleAlerted" }, media: "courtyard_alerted" },
    { condition: { flag: "smokeCoverUsed" }, media: "courtyard_smoke" },
  ],

  enterRequires: null,

  exits: {
    west: "outer_wall",
    east: "main_hall",
    south: "servant_corridor",
    north: "watch_tower",
  },

  hazards: [
    {
      type: "visitCount",
      safeUnder: 4,
      disabledIf: { flag: "smokeCoverUsed" },

      warningStages: [
        {
          at: 2,
          text: "A guard slows and turns his lantern toward your hiding place.",
        },
        {
          at: 3,
          text: "The patrol pattern tightens. Staying in the courtyard much longer will get you killed.",
        },
      ],

      deathText:
        "A lantern beam catches your movement. Steel flashes through the rain as the guards close in from every side.",
    },
  ],

  actions: [
    {
      verbs: ["use", "throw", "drop", "ignite", "deploy"],

      targets: [
        "smoke_bomb",
        "smoke bomb",
        "smoke",
        "guards",
        "patrol",
        "courtyard",
        "lanterns",
      ],

      requires: { hasItem: "smoke_bomb" },

      requiresText:
        "You have nothing that could conceal your movement.",

      failText:
        "The guards remain disciplined and alert.",

      condition: { flagFalse: "smokeCoverUsed" },

      successText:
        "You crack the smoke bomb against the wet stone. Thick pale smoke floods the courtyard, breaking the patrol formation.",

      effects: {
        setGlobalFlags: ["smokeCoverUsed"],
        setRoomState: {
          room: "courtyard",
          state: "smoke_covered",
        },
        removeItem: "smoke_bomb",
      },
    },
  ],

  objects: {
    patrol_route: {
      id: "patrol_route",

      aliases: [
        "route",
        "patrol route",
        "guards",
        "patrol",
      ],

      examineText:
        "The guards move in disciplined loops across the courtyard. Every return here increases the chance of being recognized.",

      useText:
        "You wait for a narrow gap between patrols.",
    },

    rain_basin: {
      id: "rain_basin",

      aliases: [
        "basin",
        "water basin",
        "stone basin",
      ],

      examineText:
        "The basin catches rainwater from the roof. Lantern reflections ripple across the surface.",

      useText:
        "The water is too shallow to hide anything useful.",
    },

    watch_tower_view: {
      id: "watch_tower_view",

      aliases: [
        "tower",
        "watch tower",
        "north",
        "roofline",
      ],

      examineText:
        "The watch tower rises above the northern roofline. From there, someone could watch the entire courtyard — or hide something the guards overlooked.",

      useText:
        "The tower can be reached by crossing north through the courtyard.",
    },

    main_hall_view: {
      id: "main_hall_view",

      aliases: [
        "hall",
        "main hall",
        "east",
        "doorway",
        "smoke",
        "incense",
      ],

      examineText:
        "Warm light glows through thick ceremonial smoke drifting from the eastern hall. Even from here, the incense burns your throat. Entering without covering your breath would be suicide.",

      useText:
        "Crossing directly into the smoke without protection would be fatal.",
    },

    servant_corridor_view: {
      id: "servant_corridor_view",

      aliases: [
        "corridor",
        "servant corridor",
        "south",
        "passage",
      ],

      examineText:
        "A narrow servant corridor disappears south between the wooden structures. It looks quieter than the open courtyard.",

      useText:
        "The servant route offers better cover than the open grounds.",
    },

    outer_wall_view: {
      id: "outer_wall_view",

      aliases: [
        "wall",
        "outer wall",
        "west",
        "breach",
      ],

      examineText:
        "The broken outer wall still waits to the west. The same hidden breach that brought you inside could become your escape route.",

      useText:
        "The breach remains open behind you.",
    },
  },

  flavourTargets: {
    basin: {
      id: "basin",
      aliases: ["basin", "water", "pool"],
      examineText:
        "Rain explodes across the basin in endless silver ripples.",
    },

    guards: {
      id: "guards",
      aliases: ["guards", "soldiers", "patrol"],
      examineText:
        "Their armor barely makes a sound. These are disciplined killers.",
    },

    lanterns: {
      id: "lanterns",
      aliases: ["lanterns", "lights", "torches"],
      examineText:
        "Orange lantern light sways across wet stone and black wood.",
    },

    bell: {
      id: "bell",
      aliases: ["bell", "gong"],
      examineText:
        "A heavy alarm bell hangs above the courtyard.",
    },

    smoke: {
      id: "smoke",
      aliases: [
        "smoke",
        "incense",
        "ceremonial smoke",
        "haze",
      ],
      examineText:
        "Sweet ceremonial smoke drifts from the eastern hall. Even out here, it stings the lungs.",
    },
  },

  win: false,
},

  watch_tower: {
  title: "Watch Tower",
  gridPosition: { col: 1, row: 0 },
  media: "watch_tower",
  fx: "flicker",

  baseDescription:
    "Rain blows through the open watch tower slats. Below, lantern light drifts across the courtyard stones. A stripped weapons rack leans against the north wall beside a cold signal brazier. {shuriken}\n\nTo the south, the courtyard.",

  itemText: {
    shuriken: {
      present:
        "A single steel shuriken rests half-hidden behind the lower bar of the weapons rack, catching faint lantern light.",
      taken:
        "The lower bar of the weapons rack is empty now.",
    },
  },

  states: {
    default: {
      description:
        "Rain blows through the open watch tower slats. Below, lantern light drifts across the courtyard stones. A stripped weapons rack leans against the north wall beside a cold signal brazier. {shuriken}\n\nTo the south, the courtyard.",
      fx: "flicker",
      media: "watch_tower",
    },
  },

  mediaStates: [
    { condition: { itemNotHere: "shuriken" }, media: "watch_tower_empty" },
  ],

  enterRequires: null,

  exits: {
    south: "courtyard",
  },

  hazards: [],
  actions: [],

  objects: {
    map_fragments: {
      id: "map_fragments",
      aliases: ["map", "fragments", "map fragments", "paper"],
      examineText:
        "The torn map fragments point toward a hidden archive east of the ceremonial hall. A warning beside it reads: the incense is lethal in enclosed spaces.",
      useText:
        "The fragments are too torn to guide more than that.",
    },

    signal_bell: {
      id: "signal_bell",
      aliases: ["bell", "signal bell", "alarm bell"],
      examineText:
        "If this bell rings, every guard in the castle will know.",
      useText:
        "That would be a very short infiltration.",
    },

    weapons_rack: {
      id: "weapons_rack",
      aliases: ["rack", "weapons rack", "weapon rack", "shelf", "stand"],
      examineText:
        "The rack has been stripped nearly clean. Most hooks are empty, but a single steel shuriken lies wedged behind the lower support beam.",
      useText:
        "The rack holds nothing useful except what you have already spotted.",
    },

    courtyard_view: {
      id: "courtyard_view",
      aliases: ["courtyard", "below", "grounds", "patrol"],
      examineText:
        "From the tower you can follow the entire patrol pattern below. The guards repeat the same looping route through the rain.",
      useText:
        "Watching too long risks exposing your silhouette in the tower opening.",
    },
  },

  flavourTargets: {
    mountains: {
      id: "mountains",
      aliases: ["mountains", "cliffs", "valley"],
      examineText:
        "Dark mountains vanish into mist beyond the fortress walls.",
    },

    arrows: {
      id: "arrows",
      aliases: ["arrows", "quiver"],
      examineText:
        "The arrow shafts are perfectly aligned with obsessive precision.",
    },

    signal_fire: {
      id: "signal_fire",
      aliases: ["fire", "signal fire", "brazier"],
      examineText:
        "Cold ash fills the brazier. No signal has been lit tonight.",
    },
  },

  win: false,
},
  main_hall: {
  title: "Main Hall",
  gridPosition: { col: 2, row: 1 },
  media: "main_hall",
  fx: "mist",

  baseDescription:
    "Thick ceremonial smoke hangs between lacquered armor displays and glowing paper screens. Even through protection, the incense burns at your throat.\n\nThe archive door waits to the east, sealed without a visible lock. The courtyard lies west. A quieter tea room opens to the south.",

  itemText: {},

  states: {
    default: {
      description:
        "Thick ceremonial smoke hangs between lacquered armor displays and glowing paper screens. Even through protection, the incense burns at your throat.\n\nThe archive door waits to the east, sealed without a visible lock. The courtyard lies west. A quieter tea room opens to the south.",
      fx: "mist",
      media: "main_hall",
    },
  },

  mediaStates: [],
  enterRequires: null,

  hazards: [
    {
      type: "onEnter",
      safeIf: { wearingTag: "respirator" },
      deathText:
        "You step into the main hall without covering your breath. The incense burns sweet, then sharp. Your knees fold before you can turn back.",
    },
  ],

  exits: {
    west: "courtyard",
    east: {
      to: "archive",
      condition: { flag: "archiveUnlocked" },
      lockedText:
        "The archive door is sealed. There is no visible keyhole — only a thin cord disappearing into the wooden frame.",
    },
    south: "tea_room",
  },

  actions: [
    {
      verbs: ["use", "cut", "slice", "throw", "strike", "break"],
      targets: ["shuriken", "cord", "rope", "tension line", "archive door", "door", "frame"],
      requires: { hasItem: "shuriken" },
      requiresText: "You need something sharp enough to cut the hidden cord.",
      failText: "The archive door does not move.",
      condition: { flagFalse: "archiveUnlocked" },
      successText:
        "The shuriken slips through the narrow frame gap. A hidden cord snaps inside the door.",
      effects: {
        setGlobalFlag: "archiveUnlocked",
        openExit: { dir: "east", to: "archive" },
      },
    },
    {
      verbs: ["use", "hook", "pull", "break", "force", "pry"],
      targets: ["climbing_claws", "claws", "cord", "rope", "tension line", "archive door", "door", "frame"],
      requires: { hasItem: "climbing_claws" },
      requiresText: "You need a hooked tool that can catch the hidden cord.",
      failText: "The archive door remains sealed.",
      condition: { flagFalse: "archiveUnlocked" },
      successText:
        "You slide the climbing claws into the frame and hook the hidden cord. It tears loose with a dry snap.",
      effects: {
        setGlobalFlag: "archiveUnlocked",
        openExit: { dir: "east", to: "archive" },
      },
    },
  ],

  objects: {
    archive_door: {
      id: "archive_door",
      aliases: ["door", "archive door", "sealed door", "east door", "frame", "cord", "rope", "tension line"],
      examineText:
        "The archive door has no visible keyhole. A thin cord vanishes into the wooden frame — too narrow for fingers, but not for a blade or hook.",
      useText:
        "The door resists. The cord inside the frame must be cut or pulled loose.",
    },

    incense_burners: {
      id: "incense_burners",
      aliases: ["incense", "burners", "smoke", "ceremonial smoke"],
      examineText:
        "The burners release a sweet, heavy smoke that turns sharp in the lungs. Without a mask, this hall would kill you quickly.",
      useText:
        "Disturbing the burners would only fill the hall faster.",
    },

    tea_room_view: {
      id: "tea_room_view",
      aliases: ["tea room", "south", "side room", "quiet room"],
      examineText:
        "A quieter tea room lies to the south, dim and still beyond the haze.",
      useText:
        "The southern room looks safer than standing in the smoke.",
    },

    courtyard_view: {
      id: "courtyard_view",
      aliases: ["courtyard", "west", "outside", "yard"],
      examineText:
        "Through the western doorway, rain and lantern light flicker across the courtyard stones.",
      useText:
        "The courtyard remains exposed, but at least the air is breathable.",
    },
  },

  flavourTargets: {
    incense: {
      id: "incense",
      aliases: ["incense", "smoke", "burners"],
      examineText:
        "Sweet ceremonial smoke curls through the hall in suffocating waves.",
    },

    armor: {
      id: "armor",
      aliases: ["armor", "samurai armor", "statue"],
      examineText:
        "The lacquered armor stares ahead with an expressionless iron mask.",
    },

    screens: {
      id: "screens",
      aliases: ["screens", "paper walls", "shoji"],
      examineText:
        "Thin paper screens glow softly from lantern light behind them.",
    },

    floor: {
      id: "floor",
      aliases: ["floor", "wood", "boards"],
      examineText:
        "The polished wood reflects torchlight like dark water.",
    },
  },

  win: false,
},
 archive: {
  title: "Hidden Archive",
  gridPosition: { col: 3, row: 1 },
  media: "archive_default",
  fx: "flicker",
  deathMedia: "death_guard",

  baseDescription:
    "The shogun's private archive is silent and dry. Shelves of sealed records line the walls, and a heavy document chest rests beneath them. The hall beyond reeks of thick ceremonial incense. {sealed_scroll}",

  itemText: {
    sealed_scroll: {
      present:
        "Inside the open chest lies the sealed scroll you came for, bound in dark cord and stamped with the shogun's crest.",
      taken:
        "The document chest lies open and empty. The stolen scroll is hidden under your robe.",
    },
  },

  states: {
    default: {
      description:
        "The shogun's private archive is silent and dry. Shelves of sealed records line the walls, and a heavy document chest rests beneath them. The hall beyond reeks of thick ceremonial incense. {sealed_scroll}",
      fx: "flicker",
      media: "archive_default",
    },

    alarm: {
      description:
        "The archive is no longer silent. The stolen scroll is under your robe, mechanisms clatter inside the walls, and rain breathes through a newly opened ceiling gap. {sealed_scroll}",
      fx: "flicker",
      media: "archive_alarm",
    },
  },

  mediaStates: [
    { condition: { flag: "scrollTaken" }, media: "archive_alarm" },
  ],

  enterRequires: null,

  exits: {
    west: "main_hall",

    south: {
      to: "roof_path",
      hidden: true,
      condition: { flag: "roofPathRevealed" },
    },
  },

  hazards: [
    {
      type: "commandPressure",
      condition: { flag: "scrollTaken" },
      counter: "alarmCountdown",
      threshold: 7,
      warningStages: [
        {
          at: 2,
          text: "Footsteps gather somewhere beyond the archive walls.",
        },
        {
          at: 4,
          text: "The alarm gong sounds again. The castle is narrowing around you.",
        },
        {
          at: 6,
          text: "Steel scrapes outside the archive. The elite guard has found the door.",
        },
      ],
      deathText:
        "The archive doors burst open. Black-armored guards flood the room. The scroll is torn from your robe before the final blow falls.",
    },
  ],

  actions: [
    {
      verbs: ["open", "take", "steal", "grab", "remove", "get"],
      targets: [
        "scroll",
        "sealed_scroll",
        "sealed scroll",
        "chest",
        "document",
        "evidence",
        "record",
      ],
      requires: null,
      requiresText: null,
      failText: "You cannot reach the scroll from here.",
      condition: { flagFalse: "scrollTaken" },
      successText:
        "You open the chest and take the sealed scroll. A hidden gong answers from deep inside the castle.",
      effects: {
        setGlobalFlags: ["scrollTaken", "castleAlerted"],
        setCounter: { id: "alarmCountdown", value: 0 },
        setRoomState: { room: "archive", state: "alarm" },
        giveItem: "sealed_scroll",
      },
    },

    {
      verbs: ["examine", "inspect", "pull", "press", "slide", "open", "look"],
      targets: [
        "ceiling",
        "beam",
        "loose beam",
        "panel",
        "ceiling panel",
        "latch",
        "shelf",
        "shelves",
        "airflow",
        "draft",
      ],
      requires: null,
      requiresText: null,
      failText: "You find only dust and old wood.",
      condition: { flagFalse: "roofPathRevealed" },
      successText:
        "You press the carved shelf support. A ceiling panel slides open, revealing a wet roof path above the archive.",
      effects: {
        setGlobalFlag: "roofPathRevealed",
        openExit: { dir: "south", to: "roof_path" },
      },
    },
  ],

  objects: {
    sealed_chest: {
      id: "sealed_chest",
      aliases: ["chest", "sealed chest", "document chest", "box", "scroll"],
      examineText:
        "The chest bears the shogun's private crest. Inside lies the sealed scroll you came for.",
      useText:
        "The chest opens with a quiet wooden click.",
    },

    loose_ceiling_panel: {
      id: "loose_ceiling_panel",
      aliases: [
        "ceiling",
        "panel",
        "loose panel",
        "ceiling panel",
        "beam",
        "latch",
        "draft",
        "airflow",
      ],
      examineText:
        "Cold rain air leaks around one ceiling beam. A carved shelf support below it looks slightly polished from use.",
      useText:
        "The panel will not move until the hidden latch is pressed.",
    },

    main_hall_view: {
      id: "main_hall_view",
      aliases: ["hall", "main hall", "west", "incense", "smoke"],
      examineText:
        "The main hall lies west, still filled with lethal ceremonial smoke.",
      useText:
        "Going back through the hall means trusting your mask.",
    },
  },

  flavourTargets: {
    scrolls: {
      id: "scrolls",
      aliases: ["scrolls", "documents", "records"],
      examineText:
        "Centuries of secrets sleep in tightly bound scroll cases.",
    },

    candles: {
      id: "candles",
      aliases: ["candles", "wax", "flames"],
      examineText:
        "The candle flames twitch whenever the storm wind slips inside.",
    },

    shelves: {
      id: "shelves",
      aliases: ["shelves", "bookcases", "wood"],
      examineText:
        "Dustless shelves suggest this room is still visited often. One support carving is worn smooth by repeated touch.",
    },

    ceiling: {
      id: "ceiling",
      aliases: ["ceiling", "beams", "rafters"],
      examineText:
        "One ceiling beam seems strangely loose. Cold air slips around it.",
    },
  },

  win: false,
},

 tea_room: {
  title: "Tea Room",
  gridPosition: { col: 2, row: 2 },
  media: "tea_room",
  fx: null,

  baseDescription:
    "A quiet tea room sits beside the main hall. The incense smell is stronger near the northern doorway, sharp enough to make your eyes water. Folded servant robes rest near the wall. {cloth_mask}",

  itemText: {
    cloth_mask: {
      present:
        "A folded cloth mask is tucked beneath the servant robes.",
      taken:
        "The servant robes lie disturbed where the cloth mask was hidden.",
    },
  },

  states: {
    default: {
      description:
        "A quiet tea room sits beside the main hall. The incense smell is stronger near the northern doorway, sharp enough to make your eyes water. Folded servant robes rest near the wall. {cloth_mask}",
      fx: null,
      media: "tea_room",
    },
  },

  mediaStates: [
    { condition: { itemNotHere: "cloth_mask" }, media: "tea_room_opened" },
  ],

  enterRequires: null,

  exits: {
    north: "main_hall",
    west: "servant_corridor",
  },

  hazards: [],
  actions: [],

  objects: {
    servant_robes: {
      id: "servant_robes",
      aliases: ["robes", "servant robes", "clothes", "garments", "mask", "cloth mask"],
      examineText:
        "The robes are plain servant clothing, folded in a careful stack. Beneath them, you notice a cloth mask suitable for covering your breath.",
      useText:
        "The robes are too bulky to wear over your own gear, but the mask beneath them is useful.",
    },

    main_hall_view: {
      id: "main_hall_view",
      aliases: ["main hall", "hall", "north", "smoke", "incense"],
      examineText:
        "The main hall lies north, thick with ceremonial smoke. Even from here, the incense makes your eyes water.",
      useText:
        "You should not enter that smoke without covering your breath.",
    },

    servant_corridor_view: {
      id: "servant_corridor_view",
      aliases: ["corridor", "servant corridor", "west", "passage"],
      examineText:
        "A narrow servant corridor lies west, darker and quieter than the formal rooms.",
      useText:
        "The corridor looks like a safer way deeper into the castle.",
    },
  },

  flavourTargets: {
    tea_set: {
      id: "tea_set",
      aliases: ["tea", "cups", "teapot"],
      examineText:
        "The tea has long gone cold.",
    },

    mat: {
      id: "mat",
      aliases: ["mat", "tatami", "floor"],
      examineText:
        "The tatami smells faintly of smoke and old straw.",
    },

    paper_doors: {
      id: "paper_doors",
      aliases: ["doors", "paper doors", "screens", "shoji"],
      examineText:
        "The paper doors glow softly with lantern light from the hall beyond.",
    },
  },

  win: false,
},
  servant_corridor: {
    title: "Servant Corridor",
    gridPosition: { col: 1, row: 2 },
    media: "servant_corridor",
    fx: "mist",
    baseDescription: "A narrow servant corridor runs behind the formal rooms. It smells of wet straw, smoke, and old wood.",
    itemText: {},
    states: {
      default: {
        description: "A narrow servant corridor runs behind the formal rooms. It smells of wet straw, smoke, and old wood.",
        fx: "mist",
        media: "servant_corridor",
      },
    },
    mediaStates: [],
    enterRequires: null,
    exits: {
      north: "courtyard",
      east: "tea_room",
      south: "storage_cellar",
    },
    hazards: [],
    actions: [],
    objects: {
      loose_floorboards: {
        id: "loose_floorboards",
        aliases: ["floorboards", "boards", "loose boards", "floor"],
        examineText: "The boards flex under light pressure. Servants have used this route for years.",
        useText: "You step only where the wood does not creak.",
      },
    },
    flavourTargets: {
      footprints: {
        id: "footprints",
        aliases: ["footprints", "tracks", "mud"],
        examineText: "Fresh muddy footprints disappear into the darkness.",
      },
      buckets: {
        id: "buckets",
        aliases: ["buckets", "water buckets"],
        examineText: "Wooden buckets sit abandoned beside the wall.",
      },
      beams: {
        id: "beams",
        aliases: ["beams", "wood", "supports"],
        examineText: "The corridor creaks softly whenever the wind rises.",
      },
    },
    win: false,
  },

  storage_cellar: {
  title: "Storage Cellar",
  gridPosition: { col: 1, row: 3 },
  media: "storage_cellar",
  fx: null,
  deathMedia: "death_cellar",

  baseDescription:
    "The cellar is packed with supplies, rope bundles, and hidden shinobi tools left by an unknown ally. An open crate sits behind stacked barrels beneath a hanging oil lantern.\n\n{climbing_claws}\n{smoke_bomb}\n{oil_lantern}",

  itemText: {
    climbing_claws: {
      present:
        "A pair of iron climbing claws rests inside the open crate behind the barrels.",
      taken:
        "Only fresh scratches remain where the climbing claws rested.",
    },

    smoke_bomb: {
      present:
        "Several smoke bombs sit in a lacquered wooden case beside the climbing tools.",
      taken:
        "The lacquered smoke bomb case stands open and empty.",
    },

    oil_lantern: {
      present:
        "An old oil lantern hangs from the cracked ceiling beam above the cache.",
      taken:
        "The lantern hook sways gently from the cracked beam.",
    },
  },

  states: {
    default: {
      description:
        "The cellar is packed with supplies, rope bundles, and hidden shinobi tools left by an unknown ally. An open crate sits behind stacked barrels beneath a hanging oil lantern.\n\n{climbing_claws}\n{smoke_bomb}\n{oil_lantern}",
      fx: null,
      media: "storage_cellar",
    },
  },

  mediaStates: [
    { condition: { itemNotHere: "smoke_bomb" }, media: "storage_cellar_empty_rack" },
  ],

  enterRequires: null,

  exits: {
    north: "servant_corridor",
    south: "escape_tunnel",
  },

  hazards: [
    {
      type: "visitCount",
      safeUnder: 4,
      warningStages: [
        {
          at: 2,
          text: "The stacked shelves groan as the floor shifts.",
        },
        {
          at: 3,
          text: "Dust falls from the beams. This cellar will not tolerate much more movement.",
        },
      ],
      deathText:
        "The shelves collapse in a roar of wood, jars, and stone. The cellar buries you before you can draw breath.",
    },
  ],

  actions: [],

  objects: {
    shinobi_cache: {
      id: "shinobi_cache",
      aliases: [
        "cache",
        "crate",
        "open crate",
        "shinobi cache",
        "tools",
        "equipment",
        "stash",
      ],
      examineText:
        "The open crate contains infiltration tools prepared for someone expected to pass through here.",
      useText:
        "The crate already holds everything useful inside it.",
    },

    rice_barrels: {
      id: "rice_barrels",
      aliases: [
        "barrels",
        "barrel",
        "rice barrels",
        "rice barrel",
      ],
      examineText:
        "Heavy rice barrels partly conceal the hidden tool cache.",
      useText:
        "The barrels are too heavy to move quietly.",
    },

    oil_lamp_hook: {
      id: "oil_lamp_hook",
      aliases: [
        "lantern",
        "oil lantern",
        "lamp",
        "hook",
        "beam",
      ],
      examineText:
        "An oil lantern hangs from a cracked ceiling beam, still half-filled with fuel.",
      useText:
        "The lantern could still burn if needed.",
    },

    rope_bundles: {
      id: "rope_bundles",
      aliases: ["rope", "bundles", "rope bundles", "cord"],
      examineText:
        "The rope is damp but strong. It explains how tools were smuggled into the cellar.",
      useText:
        "The bundles are too tangled to move quickly.",
    },

    escape_tunnel_view: {
      id: "escape_tunnel_view",
      aliases: ["tunnel", "escape tunnel", "south", "passage"],
      examineText:
        "A dark passage slopes south beneath the castle. Cold air rises from below.",
      useText:
        "The tunnel leads deeper under the castle.",
    },

    servant_corridor_view: {
      id: "servant_corridor_view",
      aliases: ["corridor", "servant corridor", "north", "passage"],
      examineText:
        "The servant corridor lies north, narrow and quiet behind the formal rooms.",
      useText:
        "The corridor leads back toward the castle interior.",
    },
  },

  flavourTargets: {
    crates: {
      id: "crates",
      aliases: ["crates", "boxes"],
      examineText:
        "Supply crates are stacked almost to the ceiling.",
    },

    powder: {
      id: "powder",
      aliases: ["powder", "dust", "black powder"],
      examineText:
        "Dark powder stains nearby shelves and the edge of the open case.",
    },

    damp_floor: {
      id: "damp_floor",
      aliases: ["floor", "stone floor", "damp floor"],
      examineText:
        "The stone floor is slick with cellar moisture.",
    },
  },

  win: false,
},
 escape_tunnel: {
  title: "Escape Tunnel",
  gridPosition: { col: 1, row: 4 },
  media: "escape_tunnel",
  fx: "mist",

  baseDescription:
    "A cramped tunnel slopes beneath the castle into near-total darkness. Cold water trickles across the stone floor while tangled roots push through the ceiling somewhere ahead.",

  itemText: {},

  states: {
    default: {
      description:
        "A cramped tunnel slopes beneath the castle into near-total darkness. Cold water trickles across the stone floor while tangled roots push through the ceiling somewhere ahead.",
      fx: "mist",
      media: "escape_tunnel",
    },

    hatch_revealed: {
      description:
        "Lantern light reveals an old stone escape hatch set into the tunnel ceiling above you, half-hidden by roots and packed earth. Faint voices move somewhere beyond it.",
      fx: "mist",
      media: "escape_tunnel",
    },
  },

  mediaStates: [],
  enterRequires: null,

  exits: {
    north: "storage_cellar",
  },

  hazards: [],

  actions: [
    {
      verbs: ["use", "light", "ignite", "raise", "hold"],
      targets: [
        "oil_lantern",
        "oil lantern",
        "lantern",
        "light",
        "darkness",
        "tunnel",
        "walls",
        "ceiling",
        "roots",
      ],
      requires: { hasItem: "oil_lantern" },
      requiresText: "You have no light source.",
      failText: "The darkness swallows the tunnel.",
      condition: { flagFalse: "hatchRevealed" },
      successText:
        "You light the oil lantern. Warm light crawls across the tunnel ceiling, revealing the outline of an old stone escape hatch hidden beneath roots and packed earth.",
      effects: {
        setGlobalFlag: "hatchRevealed",
        setRoomState: { room: "escape_tunnel", state: "hatch_revealed" },
      },
    },

    {
      verbs: ["use", "throw", "drop", "ignite", "deploy"],
      targets: [
        "smoke_bomb",
        "smoke bomb",
        "smoke",
        "hatch",
        "stone hatch",
        "ceiling",
        "guards",
        "voices",
      ],
      requires: { hasItem: "smoke_bomb" },
      requiresText:
        "You have no smoke bomb left. Without cover, opening the ceiling hatch would expose you to the guards above. You need another escape route.",
      failText:
        "The hatch shifts, but voices above move closer. Without smoke cover, this route is suicide.",
      condition: { flag: "hatchRevealed" },
      successText:
        "You release smoke through the hatch seams above. Guards outside shout blindly as you force the stone upward and pull yourself into the mountain rain.",
      effects: {
        setGlobalFlags: ["tunnelOpened"],
        removeItem: "smoke_bomb",
        win: true,
      },
    },

    {
      verbs: ["open", "push", "force", "lift", "move"],
      targets: ["hatch", "stone hatch", "gate", "exit", "door", "ceiling"],
      requires: null,
      requiresText: null,
      failText:
        "You cannot find the hatch clearly in the dark. You need light first.",
      condition: { flagFalse: "hatchRevealed" },
      successText:
        "Your hands find only wet stone, roots, and loose mud above you.",
      effects: {},
    },

    {
      verbs: ["open", "push", "force", "lift", "move"],
      targets: ["hatch", "stone hatch", "gate", "exit", "door", "ceiling"],
      requires: null,
      requiresText: null,
      failText:
        "The hatch shifts, but voices above move closer. Without smoke cover, this route is suicide.",
      condition: { flag: "hatchRevealed" },
      successText:
        "The hatch moves slightly overhead, but guards are waiting above. You need smoke cover or another escape route.",
      effects: {},
    },
  ],

  objects: {
    stone_hatch: {
      id: "stone_hatch",
      aliases: ["hatch", "stone hatch", "ceiling hatch", "door", "gate", "exit"],
      examineText:
        "An old stone hatch is set into the tunnel ceiling above you, half-concealed by roots and wet earth. Faint voices move somewhere beyond it.",
      useText:
        "Opening the ceiling hatch without smoke cover would expose you to the guards above.",
    },

    tunnel_darkness: {
      id: "tunnel_darkness",
      aliases: ["darkness", "dark", "shadows", "tunnel"],
      examineText:
        "The darkness hides the far end of the tunnel and the ceiling above. The sound of water makes the space feel larger than it is.",
      useText:
        "You need a light source to make sense of the tunnel.",
    },
  },

  flavourTargets: {
    water: {
      id: "water",
      aliases: ["water", "stream"],
      examineText:
        "Cold water trickles through cracks in the stone floor.",
    },

    roots: {
      id: "roots",
      aliases: ["roots", "vines"],
      examineText:
        "Tree roots have pushed through the tunnel ceiling and wrapped around the old stone hatch.",
    },

    stonework: {
      id: "stonework",
      aliases: ["stone", "stones", "wall", "walls", "masonry"],
      examineText:
        "The stones are older than the castle above. Some have shifted from years of rain and pressure.",
    },
  },

  win: false,
},
 {
  verbs: ["jump", "swing", "escape", "climb", "leap"],

  targets: [
    "tree",
    "pine",
    "branch",
    "rope",
    "forest",
    "cliff",
    "line"
  ],

  requires: { hasItem: "climbing_claws" },

  requiresText:
    "The roof edge is too slick to cross without proper climbing gear.",

  failText:
    "The storm wind nearly tears you from the roof.",

  condition: { flag: "scrollTaken" },

  successText:
    "You leap from the rain-slick roof and catch the pine branches below the castle wall. By the time the guards reach the rooftops, you have vanished into the mountain forest.",

  effects: {
    win: true,
  },
}
