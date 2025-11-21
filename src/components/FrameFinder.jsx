import { useCallback, useEffect, useState, useMemo } from "react";

const familyGuyId = "84";

const episodesUrl = `https://api.tvmaze.com/shows/${familyGuyId}/episodes`;

const episodesPromise = fetch(episodesUrl).then((response) => response.json());

export default function FrameFinder() {
  const title = "familyguy";

  const [frame, setFrame] = useState(1);

  const [found, setFound] = useState([]);

  const [episodeIndex, setEpisodeIndex] = useState(null);

  const episodesResponse = usePromise(episodesPromise);

  const episodes = useMemo(
    () => [episodesResponse].filter(Boolean).flat(),
    [episodesResponse]
  );

  const ready = episodes.length > 0 && episodeIndex === null;

  if (ready) setEpisodeIndex(0);

  const handleResponse = useCallback((response) => {
    console.log(response);

    if (response.ok) {
      setFrame((x) => x + 1);

      setFound((arr) => [...arr, response.url]);
    } else {
      setFrame(1);

      setEpisodeIndex((i) => i + 1);
    }
  }, []);

  const buildUrl = (episode) => {
    const { season, number } = episode;

    return `https://backend.everyfra.me/thumbnail/${title}/s${season}e${number}/${frame}.png`;
  };

  const url = episodes[episodeIndex] ? buildUrl(episodes[episodeIndex]) : null;

  return url ? (
    <Child onResponse={handleResponse} key={url} url={url}></Child>
  ) : (
    <>{console.log(found)}</>
  );
}

const doNothing = () => {};

function usePromise(promise) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (promise) {
      let ignore = false;

      promise.then((response) => !ignore && setState(response));

      return () => {
        ignore = true;
      };
    }
  }, [promise]);

  return state;
}

function Child({ onResponse = doNothing, url }) {
  const promise = useMemo(() => fetch(url), [url]);

  const response = usePromise(promise);

  useEffect(() => {
    if (response !== null) {
      onResponse(response);
    }
  }, [response, onResponse]);
}
