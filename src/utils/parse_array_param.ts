export const parseArrayParam = (param: any): number[] | undefined => {
  if (!param) return undefined;

  if (Array.isArray(param)) {
    // Jika param adalah array, konversikan setiap elemen menjadi angka
    return param
      .map((item) => {
        const num = parseInt(item);
        if (isNaN(num)) {
          console.warn(`Warning: "${item}" cannot be converted to a number`);
        }
        return num;
      })
      .filter((num) => !isNaN(num));
  } else if (typeof param === "string") {
    // Jika param adalah string, ubah menjadi array angka
    return param
      .split(",")
      .map((item) => {
        const num = parseInt(item.trim());
        if (isNaN(num)) {
          console.warn(`Warning: "${item}" cannot be converted to a number`);
        }
        return num;
      })
      .filter((num) => !isNaN(num));
  }

  // Jika param bukan string atau array, langsung konversikan menjadi angka tunggal
  const num = parseInt(param);
  if (isNaN(num)) {
    console.warn(`Warning: "${param}" cannot be converted to a number`);
    return undefined;
  }
  return [num];
};