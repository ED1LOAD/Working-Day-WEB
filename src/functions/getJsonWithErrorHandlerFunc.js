import getJson from "./getJson";
import requestErrorHandler from "./requestErrorHandler";

async function getJsonWithErrorHandlerFunc(func, args = []) {
  // return await (async (args) =>
  // await getJson(await requestErrorHandler(func, args)))(args);
  // await getJson(await requestErrorHandler(func, args));
  // console.log("GJWEHF ARGS");
  // console.log(args);
  // return async (args) =>
  return await (async () => {
    const d = await func(...args);
    if (!d.ok) {
      alert(
        "Произошла ошибка при обращении к серверу. Проверьте интернет-соединение и обновите страницу."
      );
      return "";
    }
    return d.json();
  })();
}

export default getJsonWithErrorHandlerFunc;
