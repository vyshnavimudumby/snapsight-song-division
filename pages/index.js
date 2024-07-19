"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Zap, Moon, Sun, Star, ChevronRight, Music, Mic, Radio, Headphones, Coffee, Bird, Flame, Cloud, Heart, Sparkles } from "lucide-react";
import axios from "axios";

const FuturisticMusicExperience = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [winningOption, setWinningOption] = useState(null);
  const [selections, setSelections] = useState({});
  const [generatedLyrics, setGeneratedLyrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicOptions, setDynamicOptions] = useState({});

  const callClaude = async (prompt) => {
    try {
      const response = await fetch("/api/call-claude", {
        method: "POST",
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      return JSON.parse(data.content[0].text);
    } catch (error) {
      console.error("Error calling Claude:", error);
      throw error;
    }
  };

  const createSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/create-session`, {
        type: "poll_multiple_choice",
        name: "AI-Driven Music Experience",
        isAlwaysOpen: true,
        location: "Online",
        description: "An AI-driven interactive music creation session",
        anonymousResponses: true,
        startDate: new Date(),
        questions: [
          {
            question: "example question 1",
            type: "text",
            votesPerUser: 1,
            chartType: "vertical",
            options: [
              {
                id: 1,
                content: "energitic",
              },
              {
                id: 2,
                content: "cool",
              },
            ],
          },
        ],
      });
      setSessionId(response.data.data.id); // Note the change to data.data.id
      setCurrentQuestionId(response.data.data.questions[0].id);
      window.open(response.data.data.links.audienceWebApp.url, "_blank");
    } catch (err) {
      setError("Failed to create session");
      console.error(err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // createSession();
  }, [createSession]);

  const addQuestion = async (question, options) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/add-question?sessionId=${sessionId}`, {
        method: "POST",
        body: JSON.stringify({
          type: "text",
          question: question,
          options: options.map((option) => ({ content: option.name })),
          votesPerUser: 1,
          chartType: "vertical",
        }),
      });
      const data = await response.json();
      setCurrentQuestionId(data.data.id); // Note the change to data.data.id
    } catch (err) {
      setError("Failed to add question");
      console.error(err);
    }
    setIsLoading(false);
  };

  const getResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/fetch-results?sessionId=${sessionId}`);
      const data = await response.json();
      const currentQuestion = data.find(
        (q) => q.questionId === currentQuestionId
      ); // Note the change to data.data.questions
      if (currentQuestion) {
        const winner = currentQuestion.options.reduce((prev, current) =>
          prev.votes > current.votes ? prev : current
        );
        setWinningOption(winner.content);
        setSelections({
          ...selections,
          [currentQuestion.question]: winner.content,
        });
      }
    } catch (err) {
      setError("Failed to get results");
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleNextStage = async () => {
    if (currentStage == 0) {
      createSession();
    }
    const nextStage = currentStage + 1;
    if (nextStage >= stages.length) {
      setCurrentStage(0);
      setWinningOption(null);
      setSelections({});
      setGeneratedLyrics(null);
      setDynamicOptions({});
      return;
    }

    if (stages[nextStage].component === SelectionScreen) {
      setWinningOption(null);
      if (stages[currentStage - 1]?.question === "Choose a Mood") {
        const chordOptions = await callClaude(
          "Generate 4 chord progressions suitable for a ${winningOption} mood. Provide the response in JSON format with keys 'name' and 'progression' as string for each option. Output JSON array only, it will be directly parsed by a system. No additional tokens."
        );
        setDynamicOptions({
          ...dynamicOptions,
          chordProgressions: chordOptions,
        });
        await addQuestion("Choose Chord Progression", chordOptions);
      } else if (
        stages[currentStage - 1]?.question === "Choose Chord Progression"
      ) {
        const styleOptions = await callClaude(
          `Generate 4 music styles based on a ${selections["Choose a Mood"]} mood and ${winningOption} chord progression. Provide the response in JSON format with keys 'name' and 'description' for each style. Output JSON array only, it will be directly parsed by a system. No additional tokens.`
        );
        setDynamicOptions({ ...dynamicOptions, styles: styleOptions });
        await addQuestion("Choose a Style", styleOptions);
      } else if (stages[currentStage - 1]?.question === "Choose a Style") {
        const chorusOptions = await callClaude(
          `Generate 4 chorus options for a song with a ${selections["Choose a Mood"]} mood, ${selections["Choose Chord Progression"]} chord progression, and ${winningOption} style. Provide the response in JSON format with keys 'name' and 'lyrics' for each chorus. Output JSON array only, it will be directly parsed by a system. No additional tokens.`
        );
        setDynamicOptions({ ...dynamicOptions, choruses: chorusOptions });
        await addQuestion("Choose a Chorus", chorusOptions);
      }
    } else if (stages[nextStage].component === ResultScreen) {
      await getResults();
    } else if (stages[nextStage].component === LyricGenerationScreen) {
      const lyrics = await callClaude(
        `Generate lyrics for a song with a ${selections["Choose a Mood"]} mood, using ${selections["Choose Chord Progression"]} chord progression in ${selections["Choose a Style"]} style, incorporating the chorus: "${selections["Choose a Chorus"]}". Provide the response in JSON format with keys 'title' and 'lyrics'. Output JSON only, it will be directly parsed by a system. No additional tokens.`
      );
      setGeneratedLyrics(lyrics);
    }

    setCurrentStage(nextStage);
  };

  const FuturisticButton = ({ onClick, children, className }) => (
    <button
      onClick={onClick}
      className={`${className} relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-400 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute top-0 left-0 w-full h-full bg-white opacity-20 transform -skew-x-12 transition-transform duration-500 ease-out group-hover:skew-x-12"></span>
    </button>
  );

  const QRCodePlaceholder = () => (
    <div className="absolute top-4 right-4 w-24 h-24 bg-white flex items-center justify-center text-black font-bold text-xs text-center">
      {sessionId ? `Session ID: ${sessionId}` : "QR Code Placeholder"}
    </div>
  );

  const WelcomeScreen = () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white p-4 relative">
      <QRCodePlaceholder />
      <h1 className="text-6xl md:text-8xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
        Snapsight x SongDivision
      </h1>
      <p className="text-2xl md:text-4xl mb-12 text-center text-blue-200">
        Forge the future of music with AI and human creativity
      </p>
      <FuturisticButton onClick={handleNextStage}>
        Begin Musical Journey
      </FuturisticButton>
    </div>
  );

  const getRandomIcon = () => {
    const icons = [
      Music,
      Mic,
      Radio,
      Headphones,
      Coffee,
      Bird,
      Flame,
      Cloud,
      Heart,
      Sparkles,
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const SelectionScreen = ({ title, options }) => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white p-4 relative">
      <QRCodePlaceholder />
      <h2 className="text-5xl md:text-7xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-8 mb-12">
        {options.map(
          ({ name, description, icon: Icon, progression, lyrics }) => {
            const RandomIcon = Icon || getRandomIcon();
            return (
              <div
                key={name}
                className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br from-blue-600 to-green-400 flex flex-col items-center justify-center p-4 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30"
              >
                <RandomIcon className="w-16 h-16 md:w-24 md:h-24 mb-4" />
                <span className="text-xl md:text-2xl font-bold mb-2">
                  {name}
                </span>
                {progression && (
                  <span className="text-lg md:text-xl mb-2">
                    {progression.split("-").join(" - ")}
                  </span>
                )}
                {description && (
                  <p className="text-sm text-center">{description}</p>
                )}
                {lyrics && (
                  <p className="text-sm text-center italic">{lyrics}</p>
                )}
              </div>
            );
          }
        )}
      </div>
      <FuturisticButton onClick={handleNextStage}>
        Next <ChevronRight className="inline ml-2" />
      </FuturisticButton>
    </div>
  );

  const ResultScreen = () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white p-4 relative">
      <QRCodePlaceholder />
      <h2 className="text-5xl md:text-7xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
        Audience Choice
      </h2>
      <div className="relative w-64 h-64 md:w-96 md:h-96">
        <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping"></div>
        {winningOption && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
            <span className="text-4xl md:text-6xl font-bold text-center">
              {winningOption}
            </span>
          </div>
        )}
      </div>
      <FuturisticButton onClick={handleNextStage} className="mt-12">
        Next <ChevronRight className="inline ml-2" />
      </FuturisticButton>
    </div>
  );

  const LyricGenerationScreen = () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white p-4 relative">
      <QRCodePlaceholder />
      <h2 className="text-5xl md:text-7xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
        {generatedLyrics?.title || "Generated Lyrics"}
      </h2>
      <div className="w-full max-w-4xl bg-black bg-opacity-50 p-8 rounded-xl mb-8">
        <pre className="whitespace-pre-wrap text-lg md:text-xl">
          {generatedLyrics?.lyrics}
        </pre>
      </div>
      <FuturisticButton onClick={handleNextStage}>
        Start New Song <ChevronRight className="inline ml-2" />
      </FuturisticButton>
    </div>
  );

  const stages = [
    { component: WelcomeScreen },
    {
      component: SelectionScreen,
      question: "Choose a Mood",
      options: [
        { icon: Zap, name: "Energetic" },
        { icon: Moon, name: "Reflective" },
        { icon: Sun, name: "Celebratory" },
        { icon: Star, name: "Inspiring" },
      ],
    },
    { component: ResultScreen },
    {
      component: SelectionScreen,
      question: "Choose Chord Progression",
      options: dynamicOptions.chordProgressions,
    },
    { component: ResultScreen },
    {
      component: SelectionScreen,
      question: "Choose a Style",
      options: dynamicOptions.styles,
    },
    { component: ResultScreen },
    {
      component: SelectionScreen,
      question: "Choose a Chorus",
      options: dynamicOptions.choruses,
    },
    { component: ResultScreen },
    { component: LyricGenerationScreen },
  ];

  const CurrentStage = stages[currentStage].component;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-green-900 text-white">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <CurrentStage
        {...stages[currentStage]}
        options={
          dynamicOptions[stages[currentStage]?.question] ||
          stages[currentStage]?.options
        }
      />
    </div>
  );
};

export default FuturisticMusicExperience;
