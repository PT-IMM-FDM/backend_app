export const pathToFileUrl = (filePath: string, apiUrl: string) => {
  let url: string = filePath.replace(/\\/g, "/");
  url = url.replace(/ /g, "%20");
  url = url.replace("public/", "");
  url = `${apiUrl}/${url}`;
  return url;
};

export const pathToFileFolder = (filePath: string) => {
  let folder: string = filePath.replace(/\\/g, "/");
  folder = folder.replace(/ /g, "%20");
  return folder;
};

export const formatSpacedFileName = (fileName: string): string => {
  return fileName.replace(/ /g, "_");
};

export const password_generator = (name: string, birth_date: Date) => {
  const first_name = name.split(" ")[0].toLowerCase();
  const dateDay = String(birth_date.getDate()).padStart(2, '0');
  const dateMonth = String(birth_date.getUTCMonth() + 1).padStart(2, '0');
  const dateFullYear = birth_date.getFullYear();

  return `${first_name}${dateDay}${dateMonth}${dateFullYear}`;
}