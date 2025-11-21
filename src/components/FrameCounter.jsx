// import { useCallback, useEffect, useState, useMemo, memo } from "react";

import { useState } from "react";

// function Temp() {
//   const episodesResponse = usePromise(episodesPromise);

//   const episodes = useMemo(
//     () => [episodesResponse].filter(Boolean).flat(),
//     [episodesResponse]
//   );

//   // const [episodeIndex, setEpisodeIndex] = useState();

//   // if (episodes.length > 0) {
//   //   setEpisodeIndex(0);
//   // }

//   // const episode =
//   //   typeof episodeIndex === "number" && episodeIndex < episodes.length
//   //     ? episodes[episodeIndex]
//   //     : null;

//   // const onStop = useCallback(() => setEpisodeIndex((i) => i + 1), []);

//   // return episode !== null ? (
//   //   <FrameCounter
//   //     key={`s${episode.season}e${episode.number}`}
//   //     season={episode.season}
//   //     number={episode.number}
//   //     onStop={onStop}
//   //   ></FrameCounter>
//   // ) : null;

//   return <FrameCounter></FrameCounter>;
// }

// const familyGuyId = "84";

// const episodesUrl = `https://api.tvmaze.com/shows/${familyGuyId}/episodes`;

// const episodesPromise = fetch(episodesUrl).then((response) => response.json());

// export default function Counter({
//   title = "familyguy",
//   number = 1,
//   season = 1,
// }) {
//   const [count, setCount] = useState(1);

//   const [stopped, setStopped] = useState(false);

//   async function fetchData(url) {
//     try {
//       const response = await fetch(url);

//       // Check for HTTP errors (e.g., 404 Not Found, 500 Internal Server Error)
//       // The fetch promise does NOT reject on HTTP error statuses, only on network failures.
//       if (!response.ok) {
//         setStopped(true);
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       setCount((x) => x + 1);
//       // const data = await response.json(); // Or response.text(), response.blob(), etc.
//       // console.log("Data fetched successfully:", data);
//       // return data;
//     } catch (error) {
//       setStopped(true);
//       // This block catches network errors, CORS issues, or errors thrown manually (like the HTTP error above).
//       console.error("Error during fetch operation:", error);
//       // You can also handle specific error types here if needed
//       // if (error instanceof TypeError) { ... }
//     }
//   }

//   const myUrl = `https://backend.everyfra.me/thumbnail/${title}/s${season}e${number}/${count}.png`;

//   if (!stopped) fetchData(myUrl);

//   if (stopped) {
//     //
//   }
// }

// function usePromise(promise) {
//   const [state, setState] = useState(null);
//   useEffect(() => {
//     if (promise) {
//       let ignore = false;

//       promise.then((response) => !ignore && setState(response));

//       return () => {
//         ignore = true;
//       };
//     }
//   }, [promise]);

//   return state;
// }

export default function Counter({
  title = "familyguy",
  number = 1,
  season = 1,
}) {
  const [count, setCount] = useState(1);

  const [stopped, setStopped] = useState(false);

  async function fetchData(url) {
    try {
      const response = await fetch(url);

      // Check for HTTP errors (e.g., 404 Not Found, 500 Internal Server Error)
      // The fetch promise does NOT reject on HTTP error statuses, only on network failures.
      if (!response.ok) {
        setStopped(true);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setCount((x) => x + 1);
      // const data = await response.json(); // Or response.text(), response.blob(), etc.
      // console.log("Data fetched successfully:", data);
      // return data;
    } catch (error) {
      setStopped(true);
      // This block catches network errors, CORS issues, or errors thrown manually (like the HTTP error above).
      console.error("Error during fetch operation:", error);
      // You can also handle specific error types here if needed
      // if (error instanceof TypeError) { ... }
    }
  }

  const myUrl = `https://backend.everyfra.me/thumbnail/${title}/s${season}e${number}/${count}.png`;

  if (!stopped) fetchData(myUrl);

  if (stopped) {
    //
  }
}
