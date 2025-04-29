import fs from 'fs'


export function isStaff(id)
{
  fs.readFile('staffEN.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log("Error reading file:", err);
      return{
        success: false,
        message: "file not found"
      }
    }
    try {
      const data = JSON.parse(jsonString);
      console.log(data);
      for(let i = 0;i < data.length;i++)
      {
        if(data[i]["discord_id"] == id)
        {
          console.log("Found User")
          return {
            success: true,
            message: data[i]["nickname"]
          }
        }
      }
      
    } catch (err) {
      console.log("Error parsing JSON:", err);
      return {
        success: false,
        message: "Something when wrong"
      }
    }
  });
}
