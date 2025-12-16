//fetch properties from the database with optional limit parameter
async function fetchProperties(limit) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/properties?limit=${limit}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch properties");
    }
    return res.json();
  } catch (error) {
    console.log(error);
  }
}

export default fetchProperties;
