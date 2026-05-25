export const ROOMS = {
  outer_wall: {
    title: "Outer Wall",
    gridPosition: { col: 0, row: 1 },
    media: "outer_wall",
    fx: "mist",
    baseDescription: "Rain lashes the outer wall of the shogun's mountain castle. Broken stones offer a narrow way inside.",
    itemText: {},
    states: {
      default: {
        description: "Rain lashes the outer wall of the shogun's mountain castle. Broken stones offer a narrow way inside.",
        fx: "mist",
        media: "outer_wall",
      },
    },
    mediaStates: [],
    enterRequires: null,
    exits: {
      east: "courtyard",
    },
    hazards: [],
    actions: [],
    objects: {
      broken_ladder: {
        id: "broken_ladder",
        aliases: ["ladder", "broken ladder", "wooden ladder"],
        examineText: "The ladder is split and useless. Whoever came before you climbed the stone itself.",
        useText: "The ladder breaks further under your hand.",
      },
      wall_stones: {
        id: "wall_stones",
        aliases: ["stones", "wall", "broken stones", "stonework"],
        examineText: "The stones are wet, but the gaps are deep enough for careful fingers.",
        useText: "You climb through the breach and slip toward the courtyard.",
      },
    },
    flavourTargets: {
      rain_tiles: {
        id: "rain_tiles",
        aliases: ["tiles", "roof", "rain"],
        examineText: "Rainwater streams down the black roof tiles like flowing ink.",
      },
      claw_marks: {
        id: "claw_marks",
        aliases: ["marks", "scratches", "claw marks"],
        examineText: "Old climbing scars cut into the stone. Someone used this route before you.",
      },
      banner: {
        id: "banner",
        aliases: ["banner", "flag", "crest"],
        examineText: "The shogun's crest hangs motionless despite the storm.",
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
    baseDescription: "The courtyard is open, wet, and dangerous. Guards patrol beneath swinging lanterns. Sweet smoke drifts from the main hall to the east, making your throat sting even from here.",
    itemText: {},
    states: {
      default: {
        description: "The courtyard is open, wet, and dangerous. Guards patrol beneath swinging lanterns. Sweet smoke drifts from the main hall to the east, making your throat sting even from here.",
        fx: "mist",
        media: "courtyard_default",
      },
      alerted: {
        description: "The courtyard is alive with alarm. Bells ring, torches flare, and guards search every shadow.",
        fx: "flicker",
        media: "courtyard_alerted",
      },
      smoke_covered: {
        description: "Smoke rolls low across the courtyard stones. The guards cough and lose sight of the walls.",
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
        warningStages: [
          { at: 2, text: "A guard pauses and looks toward your hiding place." },
          { at: 3, text: "The patrol pattern tightens. You should not keep crossing the courtyard." },
        ],
        deathText: "A lantern swings toward you. Steel flashes. The courtyard fills with shouting, and your mission ends beneath the rain.",
      },
    ],
    actions: [
      {
        verbs: ["use", "throw", "drop", "ignite", "deploy"],
        targets: ["smoke_bomb", "smoke bomb", "guards", "patrol", "courtyard", "lanterns"],
        requires: { hasItem: "smoke_bomb" },
        requiresText: "You have nothing that could cover your movement.",
        failText: "The guards remain alert.",
        condition: null,
        successText: "You crack the smoke bomb against the wet stone. Pale smoke spreads across the courtyard, swallowing the patrol line.",
        effects: {
          setGlobalFlags: ["smokeCoverUsed"],
          setRoomState: { room: "courtyard", state: "smoke_covered" },
          removeItem: "smoke_bomb",
        },
      },
    ],
    objects: {
      patrol_route: {
        id: "patrol_route",
        aliases: ["route", "patrol route", "guards", "patrol"],
        examineText: "The guards loop through the courtyard with disciplined timing. Every return here risks notice.",
        useText: "You wait for a narrow gap between patrols.",
      },
      rain_basin: {
        id: "rain_basin",
        aliases: ["basin", "water basin", "stone basin"],
        examineText: "The basin catches rainwater from the roof. Ripples distort the lantern reflections.",
        useText: "The water is too shallow to hide anything useful.",
      },
    },
    flavourTargets: {
      basin: {
        id: "basin",
        aliases: ["basin", "water", "pool"],
        examineText: "Raindrops explode across the stone basin in endless ripples.",
      },
      guards: {
        id: "guards",
        aliases: ["guards", "soldiers", "patrol"],
        examineText: "Their armor barely makes a sound. These are not careless men.",
      },
      lanterns: {
        id: "lanterns",
        aliases: ["lanterns", "lights", "torches"],
        examineText: "Orange light sways across wet stone and paper walls.",
      },
      bell: {
        id: "bell",
        aliases: ["bell", "gong"],
        examineText: "A single alarm bell waits above the courtyard.",
      },
    },
    win: false,
  },

  watch_tower: {
    title: "Watch Tower",
    gridPosition: { col: 1, row: 0 },
    media: "watch_tower",
    fx: "flicker",
    baseDescription: "The watch tower overlooks the courtyard and the roofline. A small weapons rack sits beside a cold signal brazier.",
    itemText: {
      shuriken: {
        present: "A steel shuriken lies forgotten beneath the rack.",
        taken: "",
      },
    },
    states: {
      default: {
        description: "The watch tower overlooks the courtyard and the roofline. A small weapons rack sits beside a cold signal brazier.",
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
        examineText: "The fragments show a private archive east of the main hall. A note warns: ceremonial smoke is not ordinary incense.",
        useText: "The fragments are too torn to guide more than that.",
      },
      signal_bell: {
        id: "signal_bell",
        aliases: ["bell", "signal bell", "alarm bell"],
        examineText: "If this bell rings, every guard in the castle will know.",
        useText: "That would be a very short infiltration.",
      },
    },
    flavourTargets: {
      mountains: {
        id: "mountains",
        aliases: ["mountains", "cliffs", "valley"],
        examineText: "Dark mountains vanish into mist beyond the fortress walls.",
      },
      arrows: {
        id: "arrows",
        aliases: ["arrows", "quiver"],
        examineText: "The arrow shafts are perfectly aligned with obsessive precision.",
      },
      signal_fire: {
        id: "signal_fire",
        aliases: ["fire", "signal fire", "brazier"],
        examineText: "Cold ash fills the brazier. No signal has been lit tonight.",
      },
    },
    win: false,
  },

  main_hall: {
    title: "Main Hall",
    gridPosition: { col: 2, row: 1 },
    media: "main_hall",
    fx: "mist",
    baseDescription: "Ceremonial smoke hangs thick between lacquered armor and paper screens. The archive door waits to the east.",
    itemText: {},
    states: {
      default: {
        description: "Ceremonial smoke hangs thick between lacquered armor and paper screens. The archive door waits to the east.",
        fx: "mist",
        media: "main_hall",
      },
    },
    mediaStates: [],
    enterRequires: {
      condition: { wearingTag: "respirator" },
      failText: "You step into the main hall without covering your breath. The incense burns sweet, then sharp. Your knees fold before you can turn back.",
    },
    exits: {
      west: "courtyard",
      east: {
        to: "archive",
        condition: { flag: "archiveUnlocked" },
        lockedText: "The archive door is sealed by a hidden rope tension lock inside the frame.",
      },
      south: "tea_room",
    },
    hazards: [],
    actions: [
      {
        verbs: ["use", "cut", "slice", "throw", "strike", "break"],
        targets: ["shuriken", "cord", "rope", "tension line", "archive door", "door"],
        requires: { hasItem: "shuriken" },
        requiresText: "You need something sharp enough to cut the hidden cord.",
        failText: "The archive door does not move.",
        condition: null,
        successText: "The shuriken slips through the narrow frame gap. A hidden cord snaps inside the door.",
        effects: {
          setGlobalFlag: "archiveUnlocked",
          openExit: { dir: "east", to: "archive" },
        },
      },
      {
        verbs: ["use", "hook", "pull", "break", "force", "pry"],
        targets: ["climbing_claws", "claws", "cord", "rope", "tension line", "archive door"],
        requires: { hasItem: "climbing_claws" },
        requiresText: "You need a tool that can catch the hidden cord.",
        failText: "The archive door remains sealed.",
        condition: null,
        successText: "You slide the climbing claws into the frame and hook the hidden cord. It tears loose with a dry snap.",
        effects: {
          setGlobalFlag: "archiveUnlocked",
          openExit: { dir: "east", to: "archive" },
        },
      },
    ],
    objects: {
      archive_door: {
        id: "archive_door",
        aliases: ["door", "archive door", "sealed door", "east door"],
        examineText: "The door has no visible lock. A thin cord vanishes into the wooden frame.",
        useText: "The door resists. The cord inside the frame must be cut or pulled loose.",
      },
      incense_burners: {
        id: "incense_burners",
        aliases: ["incense", "burners", "smoke", "ceremonial smoke"],
        examineText: "This is not ordinary incense. The smoke bites the lungs even through cloth.",
        useText: "Disturbing the burners would only fill the hall faster.",
      },
    },
    flavourTargets: {
      incense: {
        id: "incense",
        aliases: ["incense", "smoke", "burners"],
        examineText: "Sweet ceremonial smoke curls through the hall in suffocating waves.",
      },
      armor: {
        id: "armor",
        aliases: ["armor", "samurai armor", "statue"],
        examineText: "The lacquered armor stares ahead with an expressionless iron mask.",
      },
      screens: {
        id: "screens",
        aliases: ["screens", "paper walls", "shoji"],
        examineText: "Thin paper screens glow softly from lantern light behind them.",
      },
      floor: {
        id: "floor",
        aliases: ["floor", "wood", "boards"],
        examineText: "The polished wood reflects torchlight like dark water.",
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
    baseDescription: "The shogun's private archive is silent and dry. The hall beyond reeks of thick ceremonial incense. A sealed chest rests beneath the shelves.",
    itemText: {},
    states: {
      default: {
        description: "The shogun's private archive is silent and dry. The hall beyond reeks of thick ceremonial incense. A sealed chest rests beneath the shelves.",
        fx: "flicker",
        media: "archive_default",
      },
      alarm: {
        description: "The stolen scroll is under your robe. Somewhere inside the walls, mechanisms clatter. Rain breathes through a newly opened ceiling gap.",
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
        counter: "alarmCountdown",
        threshold: 7,
        warningStages: [
          { at: 2, text: "Footsteps gather somewhere beyond the walls." },
          { at: 4, text: "The alarm gong sounds again. You are running out of time." },
          { at: 6, text: "Steel scrapes outside the archive. The elite guard has found the door." },
        ],
        deathText: "The archive doors burst open. Black-armored guards flood the room. The scroll is torn from your hand before the final blow falls.",
      },
    ],
    actions: [
      {
        verbs: ["open", "take", "steal", "grab", "remove", "get"],
        targets: ["scroll", "sealed scroll", "chest", "document", "evidence", "record"],
        requires: null,
        requiresText: null,
        failText: "You cannot reach the scroll from here.",
        condition: { flagFalse: "scrollTaken" },
        successText: "You open the chest and take the sealed scroll. A hidden gong answers from deep inside the castle.",
        effects: {
          setGlobalFlags: ["scrollTaken", "castleAlerted"],
          setCounter: { id: "alarmCountdown", value: 0 },
          setRoomState: { room: "archive", state: "alarm" },
          giveItem: "sealed_scroll",
        },
      },
      {
        verbs: ["examine", "inspect", "pull", "press", "slide", "open", "look"],
        targets: ["ceiling", "beam", "loose beam", "panel", "latch", "shelf", "airflow"],
        requires: null,
        requiresText: null,
        failText: "You find only dust and old wood.",
        condition: { flag: "scrollTaken" },
        successText: "You press the carved shelf support. A ceiling panel slides open, revealing a wet roof path above.",
        effects: {
          setGlobalFlag: "roofPathRevealed",
          openExit: { dir: "south", to: "roof_path" },
        },
      },
    ],
    objects: {
      sealed_chest: {
        id: "sealed_chest",
        aliases: ["chest", "sealed chest", "document chest", "box"],
        examineText: "The chest bears the shogun's private crest. It contains the scroll you came for.",
        useText: "The chest opens with a quiet wooden click.",
      },
      loose_ceiling_panel: {
        id: "loose_ceiling_panel",
        aliases: ["ceiling", "panel", "loose panel", "beam", "latch"],
        examineText: "Cold rain air leaks around one ceiling beam. It may hide another way out.",
        useText: "The panel will not move until the hidden latch is found.",
      },
    },
    flavourTargets: {
      scrolls: {
        id: "scrolls",
        aliases: ["scrolls", "documents", "records"],
        examineText: "Centuries of secrets sleep in tightly bound scroll cases.",
      },
      candles: {
        id: "candles",
        aliases: ["candles", "wax", "flames"],
        examineText: "The candle flames twitch whenever the storm wind slips inside.",
      },
      shelves: {
        id: "shelves",
        aliases: ["shelves", "bookcases", "wood"],
        examineText: "Dustless shelves suggest this room is still visited often.",
      },
      ceiling: {
        id: "ceiling",
        aliases: ["ceiling", "beams", "rafters"],
        examineText: "One ceiling beam seems strangely loose.",
      },
    },
    win: false,
  },

  tea_room: {
    title: "Tea Room",
    gridPosition: { col: 2, row: 2 },
    media: "tea_room",
    fx: null,
    baseDescription: "A quiet tea room sits beside the main hall. The incense smell is stronger near the northern doorway. Your eyes water.",
    itemText: {
      cloth_mask: {
        present: "A folded cloth mask is tucked beneath servant robes.",
        taken: "",
      },
    },
    states: {
      default: {
        description: "A quiet tea room sits beside the main hall. The incense smell is stronger near the northern doorway. Your eyes water.",
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
        aliases: ["robes", "servant robes", "clothes", "garments"],
        examineText: "The robes are plain, but beneath them you notice a folded cloth mask.",
        useText: "The robes are too bulky to wear over your own gear.",
      },
    },
    flavourTargets: {
      tea_set: {
        id: "tea_set",
        aliases: ["tea", "cups", "teapot"],
        examineText: "The tea has long gone cold.",
      },
      robes: {
        id: "robes",
        aliases: ["robes", "clothes", "garments"],
        examineText: "Servant robes hang neatly despite the growing panic outside.",
      },
      mat: {
        id: "mat",
        aliases: ["mat", "tatami", "floor"],
        examineText: "The tatami smells faintly of smoke and old straw.",
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
    baseDescription: "The cellar is packed with supplies, rope bundles, and hidden shinobi tools left by an unknown ally.",
    itemText: {
      climbing_claws: {
        present: "A pair of climbing claws rests behind a rice barrel.",
        taken: "",
      },
      smoke_bomb: {
        present: "Several smoke bombs sit in a lacquered case.",
        taken: "",
      },
      oil_lantern: {
        present: "An oil lantern hangs from a cracked beam.",
        taken: "",
      },
    },
    states: {
      default: {
        description: "The cellar is packed with supplies, rope bundles, and hidden shinobi tools left by an unknown ally.",
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
          { at: 2, text: "The stacked shelves groan as the floor shifts." },
          { at: 3, text: "Dust falls from the beams. This cellar will not tolerate much more movement." },
        ],
        deathText: "The shelves collapse in a roar of wood, jars, and stone. The cellar buries you before you can draw breath.",
      },
    ],
    actions: [],
    objects: {
      rope_bundles: {
        id: "rope_bundles",
        aliases: ["rope", "bundles", "rope bundles", "cord"],
        examineText: "The rope is damp but strong. It explains how tools were smuggled in.",
        useText: "The bundles are too tangled to move quickly.",
      },
    },
    flavourTargets: {
      crates: {
        id: "crates",
        aliases: ["crates", "boxes"],
        examineText: "Supply crates are stacked almost to the ceiling.",
      },
      rope: {
        id: "rope",
        aliases: ["rope", "bundles"],
        examineText: "The rope fibers are rough and damp from cellar moisture.",
      },
      powder: {
        id: "powder",
        aliases: ["powder", "dust"],
        examineText: "Dark powder stains nearby shelves.",
      },
    },
    win: false,
  },

  escape_tunnel: {
    title: "Escape Tunnel",
    gridPosition: { col: 1, row: 4 },
    media: "escape_tunnel",
    fx: "mist",
    baseDescription: "A cramped tunnel slopes beneath the castle. Cold water trickles around a blocked stone hatch.",
    itemText: {},
    states: {
      default: {
        description: "A cramped tunnel slopes beneath the castle. Cold water trickles around a blocked stone hatch.",
        fx: "mist",
        media: "escape_tunnel",
      },
      opened: {
        description: "The stone hatch stands open. Rain and pine-scented air pour in from the mountainside.",
        fx: "mist",
        media: "escape_tunnel_open",
      },
    },
    mediaStates: [
      { condition: { flag: "tunnelOpened" }, media: "escape_tunnel_open" },
    ],
    enterRequires: null,
    exits: {
      north: "storage_cellar",
    },
    hazards: [],
    actions: [
      {
        verbs: ["use", "throw", "drop", "ignite", "deploy"],
        targets: ["smoke_bomb", "smoke bomb", "hatch", "guards", "tunnel", "shadow"],
        requires: { hasItem: "smoke_bomb" },
        requiresText: "You need cover before opening the hatch; guards are searching above.",
        failText: "The tunnel remains exposed.",
        condition: { flag: "scrollTaken" },
        successText: "You release smoke through the hatch seam. Guards above shout blindly as you force the stone open and slip out into the mountain rain.",
        effects: {
          setGlobalFlags: ["smokeCoverUsed", "tunnelOpened"],
          setRoomState: { room: "escape_tunnel", state: "opened" },
          removeItem: "smoke_bomb",
          win: true,
        },
      },
      {
        verbs: ["open", "push", "force", "lift", "move"],
        targets: ["hatch", "stone hatch", "gate", "exit", "door"],
        requires: null,
        requiresText: null,
        failText: "The hatch shifts, but guards above would see you instantly. You need smoke cover first.",
        condition: { flagFalse: "scrollTaken" },
        successText: "The hatch moves, but you have not taken the scroll yet. There is nothing to escape with.",
        effects: {},
      },
    ],
    objects: {
      stone_hatch: {
        id: "stone_hatch",
        aliases: ["hatch", "stone hatch", "door", "gate"],
        examineText: "The old escape hatch has not opened in years. Voices move somewhere above it.",
        useText: "Opening it without cover would expose you to the search party.",
      },
    },
    flavourTargets: {
      water: {
        id: "water",
        aliases: ["water", "stream"],
        examineText: "Cold water trickles through cracks in the stone.",
      },
      hatch: {
        id: "hatch",
        aliases: ["hatch", "door", "gate"],
        examineText: "The old escape hatch has not been opened in years.",
      },
      roots: {
        id: "roots",
        aliases: ["roots", "vines"],
        examineText: "Tree roots have pushed through the tunnel ceiling.",
      },
    },
    win: false,
  },

  roof_path: {
    title: "Roof Path",
    gridPosition: { col: 3, row: 0 },
    media: "roof_path",
    fx: "mist",
    baseDescription: "The roof path is slick with rain. Black tiles drop away into the courtyard far below.",
    itemText: {},
    states: {
      default: {
        description: "The roof path is slick with rain. Black tiles drop away into the courtyard far below.",
        fx: "mist",
        media: "roof_path",
      },
    },
    mediaStates: [],
    enterRequires: {
      condition: { heldTag: "tool" },
      failText: "You step onto the rain-slick roof without a grip tool. Your foot slides. The courtyard rushes upward through the storm.",
    },
    exits: {
      south: "archive",
    },
    hazards: [],
    actions: [
      {
        verbs: ["use", "climb", "grip", "hook", "scale", "escape", "cross"],
        targets: ["climbing_claws", "claws", "roof", "tiles", "edge", "escape line", "line"],
        requires: { hasItem: "climbing_claws" },
        requiresText: "You need climbing claws to cross the wet roof safely.",
        failText: "The tiles are too slick to cross barehanded.",
        condition: { flag: "scrollTaken" },
        successText: "You hook the climbing claws into the roof seams and cross the storm-black tiles. By the time the guards reach the courtyard, you are gone.",
        effects: {
          win: true,
        },
      },
    ],
    objects: {
      escape_line: {
        id: "escape_line",
        aliases: ["line", "escape line", "rope", "roof edge"],
        examineText: "A thin escape line disappears into the pines below the castle wall.",
        useText: "You need a secure grip before trusting the line.",
      },
    },
    flavourTargets: {
      rooftops: {
        id: "rooftops",
        aliases: ["roof", "rooftops", "tiles"],
        examineText: "Black rooftops stretch into the storm like waves.",
      },
      wind: {
        id: "wind",
        aliases: ["wind", "air", "storm"],
        examineText: "The mountain wind nearly tears the breath from your lungs.",
      },
      moon: {
        id: "moon",
        aliases: ["moon", "sky", "clouds"],
        examineText: "The moon appears only in broken flashes between storm clouds.",
      },
    },
    win: false,
  },
};
