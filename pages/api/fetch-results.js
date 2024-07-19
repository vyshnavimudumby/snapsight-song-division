import axios from "axios";
const PIGEONHOLE_API_BASE_URL = "https://api.pigeonholelive.com/v2";
const PIGEONHOLE_ACCESS_TOKEN =
  "QUIKSawhtiqPgvRoSkUKvGsTBzcVQ9ant7IOOeZLVxG0swr80MKKluMq3lsa8lTy";
const PIGEONHOLE_WORKSPACE_ID = "61282";
const PIGEONHOLE_ID = "806410";
export default async function handler(req, res) {
  try {
    const response = await axios.get(
      `/pigeonholes/${PIGEONHOLE_ID}/sessions/${req.query.sessionId}/insights`,
      {
        baseURL: PIGEONHOLE_API_BASE_URL,
        headers: {
          "x-api-key": PIGEONHOLE_ACCESS_TOKEN,
        },
      }
    );
    res.status(200).json(response.data.data);
  } catch (e) {
    res.status(500).json({ err: e });
  }
}
