const csv = require("csv-parser");
const fs = require("fs");
const table = require("../resource/tables/tables.json");
const orenthTypes = [
  // Orenth Types
  { abr: "Gem", color: "d902a0" },
  { abr: "Chromatic", color: "cc1606" },
  { abr: "Metallic", color: "d4af0b" },
  { abr: "Fey", color: "4bcc06" },
  { abr: "Ingens", color: "00bd97" },
  { abr: "Cosmic", color: "0077ff" },
  { abr: "Other", color: "dedede" },
  // Source for tables
  { abr: "ORE", color: "dedede" },
];

const allFeatureTypes = [
  // Sub Types
  "Emerald",
  "Crystal",
  "Amethyst",
  "Jade",
  "Ruby",
  "Topaz",
  "Sapphire",
  "Fire",
  "Lightning",
  "Wood",
  "Water",
  "Wind",
  "Chaos",
  "Fungi",
  "Gold",
  "Brass",
  "Silver",
  "Bronze",
  "Copper",
  "Moonstone",
  "Platinum",
  "Elf",
  "Hag",
  "Vampire",
  "Treant",
  "Gobos",
  "Oceanic",
  "Giant",
  "Ooze",
  "Little Folk",
  "Weapon Mastery",
  "Spell Mastery",
  "Spell Recovery",
  "Sun",
  "Abberant",

  // Tags
  "Martial",
  "Spellcasting",
  "Mastery",
  "Offensive",
  "Defensive",
  "Skill",
  "Racial",
  "Flavour",
  "Exclusive",
  "Prereq",
  "Rest",
  "Exploration",
  "Roleplay",
  "Movement",
  "Meta",
  "Piety",
];

var regex = "Tier\\s(\\d)";

function featureType(types, type) {
  types[type] = `Orenth: ${type}`;
}

function addTagIfPresent(result) {
  var tags = [];
  for (const property in result) {
    if (result[property] === "TRUE") {
      tags.push(property);
    }
  }

  return tags;
}

function createEntry(name, description) {
  return {
    type: "entries",
    name,
    entries: [description],
  };
}

function createQuote(description) {
  return {
    type: "quote",
    skipMarks: true,
    entries: [description],
  };
}

function parseDescription(description) {
  var entries = [];

  var descriptionArray = description.split("\n");

  for (var item of descriptionArray) {
    if (item.includes("*")) {
      var itemArray = item.split("*", 2);

      entries.push(createEntry(itemArray[0], itemArray[1]));
    } else if (item.endsWith("_")) {
      var trimmed = item.slice(0, -1);

      entries.push(createQuote(trimmed));
    } else {
      entries.push(item);
    }
  }

  return entries;
}

function convert(result, filename) {
  var optFeature = {};

  optFeature.name = result.Name;
  optFeature.entries = parseDescription(result.Description);

  var match = filename.match(regex);

  var level = {};

  if (match) {
    level = {
      level: +match[1],
      class: {
        name: "Tier",
      },
    };
  }

  if (result.Prerequisite) {
    optFeature.prerequisite = [{ level, feature: [result.Prerequisite] }];
  } else {
    optFeature.prerequisite = [{ level, feature: ["None"] }];
  }

  optFeature.featureType = ["ORE"];
  optFeature.source = `${result.Type}Orenth`;
  if (result.Subtype) {
    optFeature.featureType.push(result.Subtype);
  }
  optFeature.featureType.push(...addTagIfPresent(result));

  return optFeature;
}

function readFiles() {
  return new Promise((resolve, reject) => {
    var files = fs.readdirSync("resource/orenth/");

    const results = [];

    let processedCount = 0;

    for (const file of files) {
      fs.createReadStream(`resource/orenth/${file}`)
        .pipe(csv())
        .on("data", (data) => {
          if (data.Name) {
            results.push(convert(data, file));
          }
        })
        .on("end", () => {
          processedCount++;
          if (processedCount === files.length) {
            resolve(results);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    }
  });
}

function createSources() {
  var sources = [];

  for (const type of orenthTypes) {
    var source = {
      json: `${type.abr}Orenth`,
      abbreviation: type.abr,
      full: `${type.abr} Orenth`,
      authors: ["Yannick"],
      convertedBy: ["Eli"],
      version: "1.0.0",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      color: type.color,
    };

    sources.push(source);
  }

  return sources;
}

function compare(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

function writeToFile(results) {
  var optionalFeatureTypes = { ORE: "Orenth" };
  for (const type of allFeatureTypes) {
    featureType(optionalFeatureTypes, type);
  }

  var sources = createSources();

  results.sort(compare);

  var homebrew = {
    _meta: {
      sources,
      optionalFeatureTypes,
    },
    table,
    optionalfeature: results,
  };

  fs.writeFile(
    "json/Yannick; Orenth.json",
    JSON.stringify(homebrew, null, 2),
    (error) => {
      if (error) throw error;
    }
  );
}

readFiles()
  .then((results) => {
    writeToFile(results);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
