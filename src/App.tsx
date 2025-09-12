import React, { useState } from "react";
import {
  PenTool,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  Zap,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormData {
  geminiApiKey: string;
  name: string;
  classRoll: string;
  universityRoll: string;
  subjectName: string;
  subjectCode: string;
  topics: string[];
  handwritingId: number;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    classRoll: "",
    universityRoll: "",
    subjectName: "",
    subjectCode: "",
    topics: [""],
    handwritingId: 1,
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPdfContent, setIsPdfContent] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "handwritingId" ? parseInt(value) : value,
    }));
  };

  const handleTopicChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.map((topic, i) => (i === index ? value : topic)),
    }));
  };

  const addTopic = () => {
    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, ""],
    }));
  };

  const removeTopic = (index: number) => {
    if (formData.topics.length > 1) {
      setFormData((prev) => ({
        ...prev,
        topics: prev.topics.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setIsPdfContent(false);

    // Validate topics
    const validTopics = formData.topics.filter((topic) => topic.trim() !== "");
    if (validTopics.length === 0) {
      setError("At least one topic/question is required.");
      setIsGenerating(false);
      return;
    }

    // Validate handwriting ID
    if (formData.handwritingId < 1 || formData.handwritingId > 6) {
      setError("Handwriting ID must be between 1 and 6.");
      setIsGenerating(false);
      return;
    }

    try {
      const requestBody = {
        name: formData.name,
        class_roll: formData.classRoll,
        university_roll: formData.universityRoll,
        subject_name: formData.subjectName,
        subject_code: formData.subjectCode,
        topics: validTopics,
        output_filename: `${
          formData.universityRoll
        }_${formData.subjectCode.replace(/\s+/g, "")}`,
        gemini_api_key: formData.geminiApiKey || "",
        handwriting_id: formData.handwritingId,
      };

      const response = await fetch(import.meta.env.VITE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      console.log("Response content-type:", contentType); // Debug log

      if (contentType && contentType.includes("application/pdf")) {
        // Handle PDF response
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        console.log("Created PDF blob URL:", pdfUrl); // Debug log
        setGeneratedImageUrl(pdfUrl);
        setIsPdfContent(true); // Mark as PDF
      } else {
        // Handle JSON response with image/PDF data
        const result = await response.json();
        console.log("API response:", result); // Debug log

        if (result.pdf_url || result.pdf_data || result.output_path) {
          let pdfUrl;

          if (result.pdf_data) {
            // Handle base64 PDF data
            pdfUrl = `data:application/pdf;base64,${result.pdf_data}`;
            setIsPdfContent(true);
          } else if (result.pdf_url) {
            pdfUrl = result.pdf_url;
            setIsPdfContent(true);
          } else if (result.output_path) {
            // If output_path is returned, it's likely a PDF file path
            pdfUrl = result.output_path;
            setIsPdfContent(true);
          }

          console.log("Setting PDF URL:", pdfUrl); // Debug log
          setGeneratedImageUrl(pdfUrl);
        } else if (result.image_url || result.image_data) {
          // Fallback for image responses
          const imageUrl =
            result.image_url ||
            (result.image_data
              ? `data:image/png;base64,${result.image_data}`
              : null);
          setGeneratedImageUrl(imageUrl);
          setIsPdfContent(false);
        } else {
          throw new Error("No PDF or image data received from API");
        }
      }
    } catch (err) {
      console.error("Error generating assignment:", err);
      setError("Failed to generate assignment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      classRoll: "",
      universityRoll: "",
      subjectName: "",
      subjectCode: "",
      topics: [""],
      handwritingId: 1,
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
    });
    setGeneratedImageUrl(null);
    setError(null);
    setIsPdfContent(false);
  };

  const downloadImage = () => {
    if (generatedImageUrl) {
      const link = document.createElement("a");
      link.href = generatedImageUrl;

      // Use the isPdfContent state instead of URL detection
      const extension = isPdfContent ? "pdf" : "png";
      const fileName = `${formData.name.replace(
        /\s+/g,
        "_"
      )}_${formData.topics[0]?.replace(/\s+/g, "_")}_assignment.${extension}`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-80 sm:h-80 bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8 sm:mb-16 pt-4 sm:pt-8"
        >
          <motion.div
            className="inline-block bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-8 sm:py-6 mb-6 sm:mb-8 shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-violet-400">
                F*ck
              </span>{" "}
              <span className="text-slate-300 block sm:inline">
                Handwritten Assignments
              </span>
            </h1>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 mb-6 sm:mb-8 shadow-lg"
          >
            <span className="text-slate-300 font-bold text-xs sm:text-sm">
              Not backed by
            </span>
            <img
              src="/src/assets/y-combinator-seeklogo.svg"
              alt="Y Combinator"
              className="h-4 sm:h-5 w-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-2"
          >
            <p className="text-lg sm:text-2xl md:text-3xl text-white font-bold leading-relaxed">
              Transform your typed text into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-black">
                realistic handwritten documents
              </span>{" "}
              instantly!
            </p>
            <p className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-4xl mx-auto px-4">
              Perfect for university assignments cuz who tf wants to write by
              hand. Generate authentic-looking handwritten assignments with
              pencil margins, paper texture, and natural writing variations.
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex justify-center gap-2 sm:gap-4 mt-6 sm:mt-10 flex-wrap px-4"
          >
            <motion.span
              whileHover={{ scale: 1.05, y: -2 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-indigo-500/30 px-3 py-2 sm:px-6 sm:py-3 rounded-full text-indigo-300 text-xs sm:text-sm font-semibold hover:bg-slate-800/60 transition-all cursor-default shadow-lg"
            >
              <Zap className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Instant results
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.05, y: -2 }}
              className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/30 px-3 py-2 sm:px-6 sm:py-3 rounded-full text-cyan-300 text-xs sm:text-sm font-semibold hover:bg-slate-800/60 transition-all cursor-default shadow-lg"
            >
              <PenTool className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Realistic handwriting
            </motion.span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-12">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl"
          >
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                Assignment Details
              </h2>
              <p className="text-slate-400 text-base sm:text-lg">
                Fill in your information below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Personal Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-4 sm:space-y-6"
              >
                <h3 className="text-base sm:text-lg font-bold text-indigo-300 uppercase tracking-wider">
                  Personal Info
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all text-sm sm:text-base"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
                      Class Roll
                    </label>
                    <input
                      type="text"
                      name="classRoll"
                      value={formData.classRoll}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all text-sm sm:text-base"
                      placeholder="Your roll number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
                    University Roll
                  </label>
                  <input
                    type="text"
                    name="universityRoll"
                    value={formData.universityRoll}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all text-sm sm:text-base"
                    placeholder="University roll number"
                    required
                  />
                </div>
              </motion.div>

              {/* Subject Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-4 sm:space-y-6"
              >
                <h3 className="text-base sm:text-lg font-bold text-cyan-300 uppercase tracking-wider">
                  Subject Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      name="subjectName"
                      value={formData.subjectName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm sm:text-base"
                      placeholder="Computer Science, Math, etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      name="subjectCode"
                      value={formData.subjectCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm sm:text-base"
                      placeholder="CSE101, MATH201, etc."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 sm:mb-3">
                    Handwriting Style
                  </label>
                  <select
                    name="handwritingId"
                    value={formData.handwritingId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm sm:text-base"
                    required
                  >
                    <option value={1}>Style 1</option>
                    <option value={2}>Style 2</option>
                    <option value={3}>Style 3</option>
                    <option value={4}>Style 4</option>
                    <option value={5}>Style 5</option>
                    <option value={6}>Style 6</option>
                  </select>
                </div>
              </motion.div>

              {/* Topics/Questions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-violet-300 uppercase tracking-wider">
                    Topics/Questions
                  </h3>
                  <motion.button
                    type="button"
                    onClick={addTopic}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 rounded-lg text-sm font-semibold hover:bg-violet-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Topic
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {formData.topics.map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-2 sm:gap-3"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Topic/Question {index + 1}
                        </label>
                        <textarea
                          rows={2}
                          value={topic}
                          onChange={(e) =>
                            handleTopicChange(index, e.target.value)
                          }
                          className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all text-sm sm:text-base resize-none"
                          placeholder={`Enter topic/question ${index + 1}`}
                          required={index === 0}
                        />
                      </div>
                      {formData.topics.length > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => removeTopic(index)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-8 p-2 bg-red-600/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-600/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="bg-red-900/30 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl"
                  >
                    <p className="font-semibold text-sm sm:text-base">
                      Error: {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6 sm:pt-8"
              >
                <motion.button
                  type="submit"
                  disabled={isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-4 px-6 sm:py-5 sm:px-8 rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base sm:text-lg backdrop-blur-sm cursor-pointer"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2 sm:gap-3">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 sm:gap-3">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Generate Assignment
                    </span>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={resetForm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-5 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-slate-300 hover:text-white font-semibold rounded-xl sm:rounded-2xl transition-all border border-slate-600/50 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mx-auto sm:mx-0" />
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          {/* Result Section - keeping the same as before */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl"
          >
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3">
                Generated Assignment
              </h2>
              <p className="text-slate-400 text-base sm:text-lg">
                Your handwritten document will appear here
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!generatedImageUrl && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center text-slate-400 py-16 sm:py-24"
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <PenTool className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 text-slate-600" />
                  </motion.div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-300 mb-3 sm:mb-4">
                    Ready to create magic?
                  </p>
                  <p className="text-base sm:text-lg text-slate-400 max-w-sm mx-auto leading-relaxed px-4">
                    Fill out the form and click generate to get your handwritten
                    assignment
                  </p>
                </motion.div>
              )}

              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center text-slate-300 py-16 sm:py-24"
                >
                  <div className="relative mx-auto mb-6 sm:mb-8 w-20 h-20 sm:w-24 sm:h-24">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-slate-700 border-t-indigo-400 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border-4 border-transparent border-r-cyan-400 rounded-full"
                    />
                  </div>
                  <motion.p
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-4"
                  >
                    AI is crafting your assignment...
                  </motion.p>
                  <p className="text-slate-400 text-base sm:text-lg px-4">
                    This usually takes 10-30 seconds
                  </p>
                </motion.div>
              )}

              {generatedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border-2 border-slate-600/30 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-800/30 backdrop-blur-sm p-3 sm:p-6 shadow-2xl"
                  >
                    {isPdfContent ? (
                      // PDF Viewer
                      <iframe
                        src={generatedImageUrl}
                        className="w-full h-64 sm:h-96 rounded-xl sm:rounded-2xl"
                        title="Generated Assignment PDF"
                      />
                    ) : (
                      // Image Viewer
                      <img
                        src={generatedImageUrl}
                        alt="Generated Assignment"
                        className="w-full h-auto rounded-xl sm:rounded-2xl shadow-lg"
                      />
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                  >
                    <motion.button
                      onClick={downloadImage}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 sm:py-5 sm:px-8 rounded-xl sm:rounded-2xl transition-all shadow-lg text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm cursor-pointer"
                    >
                      <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                      Download {isPdfContent ? "PDF" : "Assignment"}
                    </motion.button>

                    <motion.button
                      onClick={resetForm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-5 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-slate-300 hover:text-white font-semibold rounded-xl sm:rounded-2xl transition-all border border-slate-600/50 cursor-pointer"
                    >
                      Create New
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center mt-12 sm:mt-16 text-slate-400 space-y-3 sm:space-y-4 px-4"
        >
          <p className="text-base sm:text-lg font-semibold text-slate-300">
            Built for lazy students by lazy students
          </p>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            This tool generates realistic handwritten assignments for
            educational purposes. Use responsibly and don't get caught lmao
            (we're not responsible if you do).
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
