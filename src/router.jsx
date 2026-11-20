import { createBrowserRouter } from "react-router-dom";
import NotFound from "./pages/NotFound/NotFound";
import Jeopardy from "./pages/Jeopardy/Jeopardy"
import Karaoke from "./pages/Karaoke/Karaoke";
import VillageSim from "./pages/VillageSim/VillageSim";
import Monte from "./pages/Monte/Monte";
import PendragonStore from "./pages/PendragonStore/PendragonStore";
import App from './App.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: "jeopardy",
        element: <Jeopardy />,
      },
      {
        path: "karaoke/:id",
        element: <Karaoke />,
      },
      {
        path: "village-sim",
        element: <VillageSim />,
      },
      {
        path: "monte",
        element: <Monte />,
      },
      {
        path: "monte/:roomId",
        element: <Monte />,
      },
      {
        path: "pendragon-store",
        element: <PendragonStore />,
      },
    ],
  },
]);

export default router;