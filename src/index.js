const csv = require("csv-parser");
const fs = require("fs");
const orenthTypes = [
  // Orenth Types
  { abr:"Gem", color: "ff0051" },
  { abr:"Chromatic", color: "275c01"},
  { abr:"Metallic", color: "dbdbd5"},
  { abr:"Fey", color: "59ff00" },
  { abr:"Ingens", color: "5e3602"},
  { abr:"Cosmic", color: "0c0075" },
  {abr:"Other", color: "ffffff" }
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
  const tags = [];
  for (const property in result) {
    if (result[property] === "TRUE") {
      tags.push(property);
    }
  }

  return tags;
}

function convert(result, filename) {
  var optFeature = {};

  optFeature.name = result.Name;
  optFeature.entries = [result.Description];

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
    optFeature.prerequisite = [{ level, item: [result.Prerequisite] }];
  } else {
    optFeature.prerequisite = [{ level }];
  }

  optFeature.featureType = ["ORE"];
  optFeature.source = result.Type;
  if (result.Subtype) {
    optFeature.featureType.push(result.Subtype);
  }
  optFeature.featureType.push(...addTagIfPresent(result));

  return optFeature;
}

function readFiles() {
  return new Promise((resolve, reject) => {
    var files = fs.readdirSync("resource/");

    const results = [];

    let processedCount = 0;

    for (const file of files) {
      fs.createReadStream(`resource/${file}`)
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

  for(const type of orenthTypes) {
    var source = {
        json: `${type.abr}OrenthJson`,
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

  return sources
}

function writeToFile(results) {
  var optionalFeatureTypes = { ORE: "Orenth" };
  for (const type of allFeatureTypes) {
    featureType(optionalFeatureTypes, type);
  }

  var sources = createSources();

  var homebrew = {
    _meta: {
      sources,
      optionalFeatureTypes,
    },
    optionalfeature: results,
  };

  fs.writeFile(
    "json/Yannick; Orenth.json",
    JSON.stringify(homebrew),
    (error) => {
      if (error) throw error;
    }
  );
}

readFiles()
  .then((results) => {
    //console.log("Results:", results);
    writeToFile(results);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
