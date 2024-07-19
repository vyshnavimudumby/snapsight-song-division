import axios from "axios";


export default async function handler(req, res) {
  try {
    const response = await axios.post(`https://api.anthropic.com/v1/messages`, req.body, {
      headers: {
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    });
    res.status(200).json(response.data);
  } catch (e) {
    res.status(500).json({ err: e });
  }
}
