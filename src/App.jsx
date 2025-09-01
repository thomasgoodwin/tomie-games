import { useState } from "react";
import { Button, Input, Group, Grid, GridItem, Blockquote } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import QuestionCard from "./components/Custom/QuestionCard";
import PlayerList from "./components/Custom/PlayerList";
import GECS from "./assets/audio/757.mp3";
import Arcane from "./assets/audio/arcane.mp3";
import HampsterDance from "./assets/audio/HampsterDance.mp3";
import roses from "./assets/audio/roses.mp3";

import NickTanHouse from "./assets/name-the-place/nickTanHouse.png";
import SouthHillMall from "./assets/name-the-place/southHillMall.jpg";
import GriffithObservatory from "./assets/name-the-place/griffithObservatory.png";
import TerranceHouse from "./assets/name-the-place/terranceHosue.png";

import Metapod from "./assets/pokemon/metapod100.png";
import Electrike from "./assets/pokemon/electrec200.png";
import Dunsparse from "./assets/pokemon/dunsparse300.png";
import Abomasnow from "./assets/pokemon/obamasnow400.png";

import PennyFarthing from "./assets/nostalgia-bait/Man-on-a-huge-high-wheel-bikes.jpg";
import Spam from "./assets/nostalgia-bait/spam.png";
import BabeRuth from "./assets/nostalgia-bait/BabeRuth.jpg"

import Shaihulud from "./assets/audio/shai-hulud.mp3";

import { wordToHex } from "./util";
import './App.css';

const allColorsPicked = (playerList) => {
  let allColors = true;
  Object.keys(playerList).forEach((playerId) => {
    if (playerList[playerId].color === undefined) {
      allColors = false;
    }
  });
  return allColors;
}

const questions = {
  "name-the-song-0": {
    "category": "Name the Song",
    "question": <div>
      <audio controls>
        <source src={Arcane} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>,
    "value": 100,
    "answer": "Enemy",
    "active": true
  },
  "name-the-place-0": {
    "category": "Name the Place",
    "question": <img
      src={NickTanHouse}
      alt=""
    />,
    "answer": "Nick Tan's House",
    "value": 100,
    "active": true
  },
  "who-that-pokemon-0": {
    "category": "Who's that Pokemon?",
    "question": <div className="who-that">
      <img
        src={Metapod}
        alt=""
      />
    </div>,
    "answer": "Metapod",
    "value": 100,
    "active": true
  },
  "stocks-0": {
    "category": "Stocks",
    "question": "Which livestock animal usually has a beard on the chin, in both wild and domestic species?",
    "answer": "Goats",
    "value": 100,
    "active": true
  },
  "bookworms-0": {
    "category": "Bookworms",
    "question": <>The name of this children's horror series features "Go Eat Worms" by the author R.L. Stine.</>,
    "answer": "Goosebumps",
    "value": 100,
    "active": true
  },
  "nostalgia-bait-0": {
    "category": "Nostalgia Bait",
    "question": <>
      <p>Name the primary ingredient in this food product.</p>
      <img
        src={Spam}
        alt=""
      />
    </>,
    "answer": "Ham",
    "value": 100,
    "active": true
  },
  "anime-0": {
    "category": "Anime",
    "question": <>TODO</>,
    "answer": "TODO",
    "value": 400,
    "active": true
  },
  "name-the-song-1": {
    "category": "Name the Song",
    "question": <div>
      <audio controls>
        <source src={GECS} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>,
    "value": 200,
    "answer": "757",
    "active": true
  },
  "name-the-place-1": {
    "category": "Name the Place",
    "question": <img
      src={SouthHillMall}
      alt=""
    />,
    "answer": "The South Hill Mall",
    "value": 200,
    "active": true
  },
  "who-that-pokemon-1": {
    "category": "Who's that Pokemon?",
    "question": <div className="who-that">
      <img
        src={Electrike}
        alt=""
      />
    </div>,
    "answer": "Electrike",
    "value": 200,
    "active": true
  },
  "stocks-1": {
    "category": "Stocks",
    "question": "This informal name for the stock of a gun.",
    "answer": "Butt",
    "value": 200,
    "active": true
  },

  "bookworms-1": {
    "category": "Bookworms",
    "question": <>would you still love me if i was a worm? </>,
    "answer": "Yes",
    "value": 200,
    "active": true
  },
  "nostalgia-bait-1": {
    "category": "Nostalgia Bait",
    "question": <>The most famous BB gun in the world designed more than 80 years ago.</>,
    "answer": "Red Ryder BB Gun",
    "value": 200,
    "active": true
  },
  "anime-1": {
    "category": "Anime",
    "question": <>TODO</>,
    "answer": "TODO",
    "value": 400,
    "active": true
  },
  "name-the-song-2": {
    "category": "Name the Song",
    "question": <div>
      <audio controls>
        <source src={roses} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>,
    "value": 300,
    "answer": "Roses",
    "active": true
  },
  "name-the-place-2": {
    "category": "Name the Place",
    "question": <img
      src={GriffithObservatory}
      alt=""
    />,
    "answer": "The Griffith Observatory",
    "value": 300,
    "active": true
  },
  "who-that-pokemon-2": {
    "category": "Who's that Pokemon?",
    "question": <div className="who-that">
      <img
        src={Dunsparse}
        alt=""
      />
    </div>,
    "answer": "Dunsparse",
    "value": 300,
    "active": true
  },
  "stocks-2": {
    "category": "Stocks",
    "question": "What are the traditional vegatables used in a french chicken stock?",
    "answer": "Celery, Onion, and Carrots",
    "value": 300,
    "active": true
  },
  "bookworms-2": {
    "category": "Bookworms",
    "question": <>
      <h3>Speak it's name</h3>
      <audio controls>
        <source src={Shaihulud} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </>,
    "answer": "Shai-Hulud",
    "value": 300,
    "active": true
  },
  "nostalgia-bait-2": {
    "category": "Nostalgia Bait",
    "question": <>
      <div>
        Its large front wheel provides high speeds, but became obsolete with the development of modern bicycles.
      </div>
      <img
        src={PennyFarthing}
        alt=""
        style={{ width: "300px" }}
      />
    </>,
    "answer": "Penny Farthing Machine",
    "value": 300,
    "active": true
  },
  "anime-2": {
    "category": "Anime",
    "question": <>TODO</>,
    "answer": "TODO",
    "value": 400,
    "active": true
  },
  "name-the-song-3": {
    "category": "Name the Song",
    "question": <div>
      <audio controls>
        <source src={HampsterDance} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>,
    "value": 400,
    "answer": "The Hampster Dance Song",
    "active": true
  },
  "name-the-place-3": {
    "category": "Name the Place",
    "question": <img
      src={TerranceHouse}
      alt=""
    />,
    "answer": "Terrance's House",
    "value": 400,
    "active": true
  },
  "who-that-pokemon-3": {
    "category": "Who's that Pokemon?",
    "question": <div className="who-that">
      <img
        src={Abomasnow}
        alt=""
      />
    </div>,
    "answer": "Abomasnow",
    "value": 400,
    "active": true
  },
  "stocks-3": {
    "category": "Stocks",
    "question": <>This footwear sported by ninjas is used to <i>stalk</i> their prey.</>,
    "answer": "Tabi",
    "value": 400,
    "active": true
  },
  "bookworms-3": {
    "category": "Bookworms",
    "question": <>The word-forming puzzle game, Bookworm, features a worm of a certain color.</>,
    "answer": "Green",
    "value": 400,
    "active": true
  },
  "nostalgia-bait-3": {
    "category": "Nostalgia Bait",
    "question": <>
      <p>The name of the first team this popular baseball player played for.</p>
      <img
        src={BabeRuth}
        alt=""
      />
    </>,
    "answer": "Boston Red Sox",
    "value": 400,
    "active": true
  },
  "anime-3": {
    "category": "Anime",
    "question": <>TODO</>,
    "answer": "TODO",
    "value": 400,
    "active": true
  },
};

const LastQuestion = ({ gameState }) => {
  let allAnswered = true;
  Object.keys(gameState).forEach((questionKey) => {
    if (gameState[questionKey].active === true) {
      allAnswered = false;
    }
  });
  const [showFinalQuestion, setShowFinalQuestion] = useState(false);
  const [showFinalAnswer, setShowFinalAnswer] = useState(false);

  return <div style={{ display: "flex", justifyContent: "center" }}>
    {allAnswered && <div style={{ width: "50%", borderRadius: "4px", border: "1px solid white", padding: "1rem", margin: "1rem" }}>
      <h2 style={{ fontSize: "2rem" }}><b>Final Question</b></h2>
      <h3>catgegory</h3>
      <div className="question">
        <Blockquote.Root variant="solid" marginLeft={"1rem"}>
          <Blockquote.Content>
            {showFinalQuestion && <p>
              test1
            </p>}
          </Blockquote.Content>
        </Blockquote.Root>
        {showFinalAnswer && <p>
          test2
        </p>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button variant="outline" size="sm" onClick={() => setShowFinalQuestion(true)}>Show Question</Button>
        <Button variant="outline" size="sm" onClick={() => setShowFinalAnswer(true)}>Show Answer</Button>
      </div>
    </div>}
  </div>;
}

function App() {
  const [gameInfo, setGameInfo] = useState(undefined);
  const animation = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2 }
  };

  const [playerList, setPlayerList] = useState({});
  const [newPlayerName, setNewPlayerName] = useState("");
  const [errorMessage, setErrorMessage] = useState(undefined);
  const [gameState, setGameState] = useState(questions);

  const maxPlayers = 4;
  let playerCount = Object.keys(playerList).length;

  return <AnimatePresence mode="wait">
    {gameInfo === undefined ? (
      <motion.div
        key="start-game"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        {...animation}
      >
        <div style={{ display: "flex", justifyContent: 'center' }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center", width: "100%" }}>
            <h1 style={{ fontWeight: "bold", fontSize: "2rem" }}>Player List:</h1>
            <PlayerList players={playerList} setPlayerList={setPlayerList} />
            <Group attached w="full" maxW="sm">
              <Input
                flex="1"
                placeholder="Name..."
                variant="outline"
                value={newPlayerName}
                onChange={(e) => {
                  setNewPlayerName(e.currentTarget.value)
                }}
                disabled={playerCount >= maxPlayers}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerCount < maxPlayers && newPlayerName !== "") {
                    if (playerList[newPlayerName] !== undefined) {
                      setErrorMessage("Unique usernames are required.")
                      return;
                    } else {
                      setErrorMessage(undefined);
                    }
                    let copy = structuredClone(playerList);
                    copy[newPlayerName] = {
                      color: undefined,
                      points: 0
                    }
                    setPlayerList(copy);
                    setNewPlayerName("");
                  }
                }}
              />
              <Button
                bg="bg.subtle"
                variant="outline"
                disabled={playerCount >= maxPlayers || newPlayerName === ""}
                onClick={() => {
                  if (playerList[newPlayerName] !== undefined) {
                    setErrorMessage("Unique usernames are required.")
                    return;
                  } else {
                    setErrorMessage(undefined);
                  }
                  let copy = structuredClone(playerList);
                  copy[newPlayerName] = {
                    color: undefined,
                    points: 0
                  }
                  setPlayerList(copy);
                  setNewPlayerName("");
                }}
              >
                Submit
              </Button>
            </Group>
            {errorMessage && <div className="error-message">
              {errorMessage}
            </div>}
          </div>
        </div>
        <div>
          <Button className="start-game-button" onClick={() => setGameInfo({})} disabled={playerCount === 0 || !allColorsPicked(playerList)}>
            Start Game
          </Button>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="dashboard"
        {...animation}
      >
        <h1 style={{ fontSize: "4rem" }}>
          <span className="shadow-dance-text">Cashout</span> or <span className="melting-text-container">
            <span className="melting-text">Crashout</span>
          </span>
        </h1>
        <LastQuestion gameState={gameState} />
        <div style={{ padding: "0px 2rem" }}>
          <Grid templateColumns="repeat(4, 1fr)" gap="6" marginBottom="3rem">
            {Object.keys(playerList).map((playerId) => {
              return <GridItem>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                  <b style={{ fontSize: "3rem", color: wordToHex[playerList[playerId].color] }}>{playerId}</b>
                </div>
                <div style={{ fontSize: "2rem", textAlign: "center" }}>
                  {playerList[playerId].points}
                </div>
              </GridItem>
            })}
          </Grid>
        </div>
        <div className="game-dashboard">
          <Grid templateColumns="repeat(7, 1fr)" gap="6">
            {["Name the Song", "Name the Place", "Who's that Pokemon?", "Stocks", "Bookworms", "Nostalgia Bait", "Anime"].map((v) => {
              return <GridItem>
                <b style={{ fontSize: "1.2rem" }}>
                  {v}
                </b>
              </GridItem>
            })}
            {Object.keys(gameState).map((questionId) => {
              return <GridItem>
                <QuestionCard
                  questionId={questionId}
                  question={gameState[questionId]}
                  players={playerList}
                  setPlayerList={setPlayerList}
                  disabled={gameState[questionId].active === false}
                  gameState={gameState}
                  setGameState={setGameState}
                />
              </GridItem>
            })}
          </Grid>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
};

export default App;