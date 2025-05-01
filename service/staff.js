import fs from 'fs'

export function isStaff(id) {
  return new Promise((resolve, reject) => {
    fs.readFile('staffEN.json', 'utf8', (err, jsonString) => {
      if (err) {
        console.error("Error reading file:", err);
        return resolve({
          success: false,
          message: "file not found"
        });
      }

      try {
        const data = JSON.parse(jsonString);
        for (let i = 0; i < data.length; i++) {
          if (data[i]["discord_id"] == id) {
            console.log("Found User");
            return resolve({
              success: true,
              message: data[i]["nickname"]
            });
          }
        }
        return resolve({
          success: false,
          message: "user not found"
        });

      } catch (err) {
        console.error("Error parsing JSON:", err);
        return resolve({
          success: false,
          message: "Something went wrong"
        });
      }
    });
  });
}