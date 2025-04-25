import { useState, useEffect } from "react";

function useAsync(func, ret, args = [], deps = []) {
  // const [end, setEnd] = useState(false);
  // const [data, setData] = useState(undefined);
  // console.log("FUNC");
  // console.log(func);
  // console.log("RET");
  // console.log(ret);
  // console.log("ARGS");
  // console.log(args);
  useEffect(() => {
    const f = async () => {
      const d = await func(...args);
      // const d = await func(args);
      // console.log("USEASYNC DATA");
      // console.log(d);
      ret(d);
      // setData(d);
      // setEnd(true);
    };

    f();
  }, deps);

  // console.log("USEASYNC DATA");
  // console.log(data);
  // return !end ? null : data;
}

export default useAsync;
