import { Link } from "@chakra-ui/react";

const App = () => {

  return <div style={{ display: "flex", justifyContent: "center", padding: "2rem", gap: "2rem" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
        Home
      </h1>
      <Link style={{ display: "flex", justifyContent: "center" }} href="/karaoke/aaa">Karaoke</Link>
      <Link style={{ display: "flex", justifyContent: "center" }} href="/jeopardy">Jeopardy</Link>
    </div>
  </div>
};

export default App;