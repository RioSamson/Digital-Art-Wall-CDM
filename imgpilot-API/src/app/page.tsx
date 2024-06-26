"use client";
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/excalidraw/dist/";
}

import { Dice } from "@/components/dice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { getRandomDifferent } from "@/lib/utils";
import { zoomToFit } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import {
  getLocalState,
  LocalState,
  saveToLocalState,
} from "@/util/local-store";
import {
  artStyles,
  paintingTypes,
  predefineState,
  presets,
} from "@/util/presets";
import { useCallbackRefState } from "@/util/useCallbackRefState";
import { useExcalidrawResponse } from "@/util/useExcalidrawResponse";
import { usePrevious } from "@/util/usePrevious";
import { CircleDash, Download } from "@carbon/icons-react";
import type { ExcalidrawElement, ExcalidrawImageElement} from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import planetImage from './img-resource/planet.png';
import ufoImage from './img-resource/ufo.png';
import personImage from './img-resource/person.png';
import planetFrameImage from './img-resource/PlanetFrame.png';
import penImage from './img-resource/pen.png';
import eraserImage from './img-resource/eraser.png';
import magicPenImage from './img-resource/magicpen.png';




import { useEffect, useMemo, useRef, useState } from "react";
import { useThrottledCallback } from "use-debounce";

//here, we import excalidraw dynamically so we only import when we need to.
//ssr means that the server side rendering is set to false so only client side rendering will happen
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false, 
  },
);

//we will not need this as this is for the little icon on the edge
const GitHubCorners = dynamic(
  async () => (await import("@uiw/react-github-corners")).default,
  {
    ssr: false,
  },
);

const getVersion = (elements: readonly ExcalidrawElement[]): string => {
  return elements.map((e) => e.version).join("");
};

export default function Home() {
  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();
 
//  useState initializes drawState with a default value and provides setDrawState to update it.
//  drawState is an object with properties: style, prompt, image, and elements.
    const [drawState, setDrawState] = useState<LocalState>({
    style: "",
    prompt: "",
    image: "",
    elements: [],
  });

  const [beautifyImage, setBeautifyImage] = useState("");
  const paintType = useRef<string | null>(null);
  const artStyle = useRef<string | null>(null);
  const [beautifyLoading, setBeautifyLoading] = useState(false);
  const [init, setInit] = useState(false);
  const [activeTool, setActiveTool] = useState("freedraw");
  const [activeButton, setActiveButton] = useState<string | null>(null);
  useEffect(() => {
    setDrawState(getLocalState());
    setInit(true);
  }, []);
  const setDrawStateThrottle = useThrottledCallback(setDrawState, 500);
  const clearExcalidrawCanvas = () => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({ elements: [] });s
    }
  };

  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
    if(buttonName === 'magicPen'){
      if (loading) return;
      setBeautifyLoading(true);
      fetchImage(imageSrc, realPrompt, 512)
      .then((data) => {
        setBeautifyImage(data);
        setBeautifyLoading(false);
      })
      .catch(() => {
        setBeautifyLoading(false);
      });
    }
    if (buttonName === 'planet') {
      const elements = convertToExcalidrawElements([{ type: "ellipse", x: 100, y: 250 }]);
      setDrawState((state) => ({ ...state, elements }));
    }
  }
  useEffect(() => {
    setBeautifyImage("");
  }, [drawState.prompt, drawState.elements]);

  const realPrompt = useMemo(
    () => `${drawState.prompt},beautify ${drawState.style} style`,
    [drawState.prompt, drawState.style],
  );

  const { base64, loading } = useExcalidrawResponse(
    excalidrawAPI,
    drawState.elements,
    realPrompt,
    getVersion(drawState.elements),
  );

  const previousBase64 = usePrevious(base64);

  const imageSrc = useMemo(() => {
    return beautifyImage || base64 || previousBase64 || drawState.image;
  }, [previousBase64, base64, beautifyImage, drawState.image]);

  useEffect(() => {
    if (
      drawState.elements.length ||
      imageSrc ||
      drawState.prompt ||
      drawState.style
    ) {
      saveToLocalState({ ...drawState, image: imageSrc });
    }
  }, [drawState, imageSrc]);

  useEffect(() => {
    if (excalidrawAPI) {
      setTimeout(() => zoomToFit(excalidrawAPI));
    }
  }, [excalidrawAPI]);
 
  return (
    <div className="inset-0 absolute flex flex-col">
      <div className="flex justify-between items-center pt-4 px-20">
        <div className="flex gap-20">
          <a href="#" className={`button-image ${activeButton === 'planet' ? 'active' : ''}`} onClick={() => handleButtonClick('planet')}>
            <img src={planetImage.src} alt="planet" className="button-image" width={60} height={60} />
          </a>
          <a href="#" className={`button-image ${activeButton === 'ufo' ? 'active' : ''}`} onClick={() => handleButtonClick('ufo')}>
            <img src={ufoImage.src} alt="UFO" className="button-image" width={60} height={60} />
          </a>
          <a href="#" className={`button-image ${activeButton === 'person' ? 'active' : ''}`} onClick={() => handleButtonClick('person')}>
            <img src={personImage.src} alt="person" className="button-image" width={60} height={60} />
          </a>
        </div>
        <Button>Upload</Button>
        <Button onClick={clearExcalidrawCanvas}>
               clear
        </Button>
      </div>
      <Toaster></Toaster>  
      <div className="h-full w-full flex flex-col gap-8 pt-8">

        {/* start of the drawing canvas */}
        <div className="flex-1 flex flex-row lg:flex-col gap-4 px-20">
          <div className="w-full h-full min-h-[100px] lg:h-2/3 rounded border-zinc-300 overflow-hidden border relative flex">
            <div className={`flex-0 w-11 border-r bg-zinc-100 border-zinc-200 ${activeTool}`}></div>
            <div className={`flex-1 relative `}>
              <Excalidraw
                detectScroll={true}
                autoFocus={true}
                initialData={{
                  elements: drawState.elements,
                  appState: predefineState,
                }}
                excalidrawAPI={excalidrawRefCallback}
                onChange={(elements, appState) => {
                  setActiveTool(appState.activeTool.type);
                  setDrawStateThrottle((state) => ({ ...state, elements }));
                }}
              ></Excalidraw>
            </div>
          </div>

          {/* styles the div classes using TAILWIND CSS to style it withing the html container */}
          {/* <div className="w-1/6 h-1/6 min-h-[10px] lg:h-full bg-white rounded border-zinc-300 overflow-hidden border relative"> */}
            {/* <div className="absolute inset-0 flex justify-center items-center"> */}
              {/* {imageSrc && init && (
                <img
                  alt="img"
                  className="w-full h-full object-contain"
                  src={imageSrc}
                />
              )} */}
              {/* {(loading || beautifyLoading) && (
                <div className="absolute left-4 bottom-4">
                  <CircleDash className="h-4 w-4 text-zinc-400 animate-spin"></CircleDash>
                </div>
              )} */}
              {/* <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-2 right-2"
                asChild
              >
                <a href={imageSrc} download>
                  <Download />
                </a>
              </Button> */}
            {/* </div> */}
          {/* </div> */}
        {/* ---------end of the right side drawing image -------------------------------------*/}
        </div>



        {/* ------------------This div contains the whole bottom pannel-------------------- */}
        <div className="flex w-full items-end gap-6 px-4 pb-8">
          <div className="flex gap-1 items-center">
            {/* commented out the logo of imgpilot */}
            {/* <div className="flex-0 hidden md:block"> 
              <Image alt="logo" src="/logo.svg" height={46} width={46} />
            </div> */}
            <div className="flex-0 flex flex-col"> 
              <div className="text-xs hidden md:block text-zinc-600 hover:text-zinc-900">   
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-2 items-end">
          {/* <div className="flex-0 w-full md:w-96"> */}
              {/* <div className="text-xs pl-1 text-zinc-600">
                What do you want to draw
              </div>
              <Input
                type="text"
                value={drawState.prompt}
                onChange={(e) =>
                  setDrawState((state) => ({
                    ...state,
                    prompt: e.target.value,
                  }))
                }
                className="h-9 !ring-0 border-zinc-300 !ring-offset-0"
                placeholder=""
              />
            </div>
            <div className="flex-1 hidden md:block">
              <div className="text-xs pl-1 text-zinc-600">
                What is the painting style
              </div>
              <Input
                type="text"
                value={drawState.style}
                onChange={(e) =>
                  setDrawState((state) => ({ ...state, style: e.target.value }))
                }
                className="h-9 !ring-0 border-zinc-300 !ring-offset-0"
                placeholder=""
              /> */}
            {/* </div> */}
            {/* <Button
              disabled={beautifyLoading} //btn is disabbled while beutify is loading
              size="sm" //btn size small
              onClick={() => { //when clicked...
                artStyle.current = getRandomDifferent(
                  artStyles,
                  artStyle.current,
                ); //gets a random art style
                paintType.current = getRandomDifferent(
                  paintingTypes,
                  paintType.current,
                ); //get paint style
                setDrawState((state) => ({
                  ...state,
                  style: `${paintType.current}, ${artStyle.current}`,
                }));
              }}
            >
              <Dice /> 
            </Button> 
            <Button
              disabled={beautifyLoading}
              size="sm"
              onClick={() => {
                if (loading) return;
                setBeautifyLoading(true);
                fetchImage(imageSrc, realPrompt, 512)
                  .then((data) => {
                    setBeautifyImage(data);
                    setBeautifyLoading(false);
                  })
                  .catch(() => {
                    setBeautifyLoading(false);
                  });
              }}
            >
              <Wand2 size={16} />
            </Button>
            <Button onClick={clearExcalidrawCanvas}>
               clear
            </Button> */}
          </div>
        </div>
        {/* --------------------------- end of bottom pannel div ------------------------------*/}

      </div>
      <div className="flex justify-center items-center mt-8 space-x-8">
        <a href="#" className={`button-image ${activeButton === 'pen' ? 'active' : ''}`} onClick={() => handleButtonClick('pen')}>
          <img src={penImage.src} alt="planet" className="button-image" width={60} height={60} />
        </a>
        <a href="#" className={`button-image ${activeButton === 'eraser' ? 'active' : ''}`} onClick={() => handleButtonClick('eraser')}>
          <img src={eraserImage.src} alt="eraser" className="button-image" width={60} height={60} />
        </a>
        <a href="#" className={`button-image ${activeButton === 'magicPen' ? 'active' : ''}`} onClick={() => handleButtonClick('magicPen')}>
          <img src={magicPenImage.src} alt="magicPen" className="button-image" width={60} height={60} />
        </a>
      </div>
    </div>
  );
}
