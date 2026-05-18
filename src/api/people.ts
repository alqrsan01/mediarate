import api from "./auth";

export const getPersonDetails = (id: number) =>
  api.get("/people/details.php", { params: { id } });
