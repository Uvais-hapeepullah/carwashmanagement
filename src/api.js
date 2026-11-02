// All browser-to-server requests go through this one small helper.
const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function api(path, method = "GET", body) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check that npm run dev is running.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}
