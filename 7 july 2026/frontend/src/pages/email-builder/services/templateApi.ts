import type { Template } from "../types/template";

const API_BASE_URL =
  "http://localhost:8080/api/sensorData";

export const getTemplate = async ():any => {
  const result = await fetch(`${API_BASE_URL}/template`);

  //console.log("templateApi",result);

  if(!result.ok){
    return null;
  }

  return await result.json();
};

export const saveTemplate = async (
  template: Template
) => {
  await fetch(`${API_BASE_URL}/template`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
  });
};