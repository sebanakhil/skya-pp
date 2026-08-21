import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import WordPoke from "./wordpoke/WordPoke.jsx";

function Root() {
  const [hash, setHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (hash.startsWith("#wordpoke")) return <WordPoke />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
