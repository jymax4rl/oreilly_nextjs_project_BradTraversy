async function fetchProperties() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/properties`);
    if (!res.ok) {
      throw new Error("Failed to fetch properties");
    }
    return res.json();
  } catch (error) {
    console.log(error);
  }
}

export default fetchProperties;
