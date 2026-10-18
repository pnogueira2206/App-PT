// Default buckets and movements (Kyle's groups). The coach can edit movements and
// synonyms in the Coverage tab; these are only the starting list.
(function () {
  const BUCKETS = [
    { id: "barRingRope", label: "Bar / ring / rope", unit: "reps" },
    { id: "basicCF", label: "Basic CF", unit: "reps" },
    { id: "erg", label: "Erg", unit: "km" },
    { id: "barbell", label: "Barbell", unit: "reps" },
    { id: "inverted", label: "Inverted", unit: "reps" },
    { id: "dbkb", label: "DB / KB", unit: "reps" },
    { id: "oddObject", label: "Odd object", unit: "reps" },
    { id: "runSwim", label: "Run / swim", unit: "km" },
    { id: "midline", label: "Midline", unit: "reps" },
    { id: "pistols", label: "Pistols", unit: "reps" },
  ];

  // [name, bucket, synonyms]
  const MOVEMENTS = [
    ["Toes-to-Bar", "barRingRope", "T2B, TTB"],
    ["Chest-to-Bar Pull-up", "barRingRope", "C2B, CTB, Chest to Bar"],
    ["Bar Muscle-up", "barRingRope", "BMU"],
    ["Ring Muscle-up", "barRingRope", "RMU, Muscle-up, MU"],
    ["Legless Rope Climb", "barRingRope", "LRC, Legless"],
    ["Rope Climb", "barRingRope", "RC"],
    ["Ring Dip", "barRingRope", ""],
    ["Pull-up", "barRingRope", "Pullup"],
    ["Bar-Facing Burpee", "basicCF", "BFB, Bar Facing Burpee, Burpee Over Bar, BOB"],
    ["Push-up", "basicCF", "Pushup"],
    ["Box Jump-Over", "basicCF", "BJO, Box Jump Over"],
    ["Box Jump", "basicCF", "BJ"],
    ["Dumbbell Box Step-Over", "basicCF", "DB Box Step Over, DBSO"],
    ["Double-Under", "basicCF", "DU, Double Under"],
    ["Burpee Box Jump-Over", "basicCF", "BBJO, Burpee Box Jump Over"],
    ["Burpee", "basicCF", ""],
    ["Wall Ball", "basicCF", "WB, WBS, Wall Ball Shot"],
    ["Walking Lunge", "basicCF", "Lunge"],
    ["Box Step-Over", "basicCF", "Box Step Over, BSO"],
    ["Lateral Bar-Over Jump", "basicCF", "Lateral Burpee Over Bar"],
    ["Echo Bike", "erg", "Assault Bike, Air Bike, Bike"],
    ["Ski Erg", "erg", "Ski, SkiErg"],
    ["Bike Erg", "erg", "BikeErg, C2 Bike"],
    ["Row", "erg", "Rower, Row Erg, Rowing"],
    ["Thruster", "barbell", ""],
    ["Power Clean", "barbell", "PC"],
    ["Squat Clean", "barbell", "Clean"],
    ["Hang Power Clean", "barbell", "HPC"],
    ["Power Snatch", "barbell", "PS"],
    ["Squat Snatch", "barbell", "Snatch"],
    ["Hang Power Snatch", "barbell", "HPS"],
    ["Clean & Jerk", "barbell", "C&J, CJ, Clean and Jerk"],
    ["Shoulder to Overhead", "barbell", "S2OH, STOH"],
    ["Overhead Squat", "barbell", "OHS"],
    ["Handstand Push-up", "inverted", "HSPU"],
    ["Handstand Walk", "inverted", "HSW"],
    ["Wall Walk", "inverted", ""],
    ["DB Snatch", "dbkb", "Dumbbell Snatch"],
    ["DB Clean & Jerk", "dbkb", "Dumbbell Clean and Jerk, DB C&J"],
    ["DB Thruster", "dbkb", "Dumbbell Thruster"],
    ["KB Swing", "dbkb", "KBS, Kettlebell Swing"],
    ["Devil Press", "dbkb", ""],
    ["Sandbag Over Shoulder", "oddObject", "Sandbag OTS"],
    ["D-Ball Over Shoulder", "oddObject", "DBall Over Shoulder"],
    ["Sandbag Clean", "oddObject", ""],
    ["Run", "runSwim", "Corrida, Running"],
    ["Swim", "runSwim", "Natação, Swimming"],
    ["GHD Sit-up", "midline", "GHD"],
    ["Sit-up", "midline", "Abmat Sit-up"],
    ["V-up", "midline", ""],
    ["Pistol", "pistols", "Pistol Squat"],
  ];

  window.CRX = window.CRX || {};
  window.CRX.BUCKETS = BUCKETS;
  window.CRX.defaultMovements = () =>
    MOVEMENTS.map(([name, bucket, syn]) => ({
      name,
      bucket,
      aliases: syn ? syn.split(",").map((s) => s.trim()).filter(Boolean) : [],
    }));
})();
