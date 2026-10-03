import type { Branch, Interest, SkillLevel } from "./options";
import type { Blueprint, BlueprintInput, Difficulty, PlanStep } from "./types";

// Deterministic blueprint generator. Used when no AI key is configured and
// whenever the AI call fails, so the product never depends on an external API.
// One hand-written template per (interest, skill level), personalised with a
// branch-specific angle. Same input always gives the same blueprint.

type Template = Omit<Blueprint, "difficulty">;

const plan = (...steps: [number, string][]): PlanStep[] => steps.map(([minutes, step]) => ({ minutes, step }));

const TEMPLATES: Record<Interest, Record<SkillLevel, Template>> = {
  chatbots: {
    beginner: {
      title: "PlacementPrep Bot",
      problem:
        "Placement season questions (eligibility, rounds, dates) are buried in long PDFs and WhatsApp threads. Build a chatbot that answers them from your college's placement handbook, and says so when the answer is not in the document.",
      stack: ["Python", "Streamlit", "LLM API", "PyPDF"],
      build_plan: plan(
        [5, "Create a Python environment and store your LLM API key in a .env file."],
        [10, "Extract the text of the placement handbook PDF with PyPDF and save it as plain text."],
        [15, "Write a prompt that answers only from that text and replies 'not in the handbook' otherwise."],
        [20, "Build a Streamlit chat screen with message history and a clear-chat button."],
        [10, "Test with 10 real questions, fix the two worst answers, and deploy to Streamlit Cloud."],
      ),
      resume_bullet:
        "Built and deployed an LLM chatbot (Python, Streamlit) that answers placement questions grounded in a [N]-page handbook, with a refusal path for out-of-scope questions.",
    },
    intermediate: {
      title: "Syllabus Q&A with Retrieval",
      problem:
        "Pasting a whole syllabus into a prompt is slow, costly and still misses details. Build a retrieval-augmented assistant that finds the right paragraphs first and answers with the source page shown.",
      stack: ["Python", "FastAPI", "ChromaDB", "Sentence-Transformers", "LLM API"],
      build_plan: plan(
        [10, "Split two subject PDFs into ~300-word chunks and embed them with a sentence-transformer."],
        [10, "Store the chunks in ChromaDB and write a function that returns the top 4 matches for a question."],
        [15, "Send the question plus retrieved chunks to the LLM and return the answer with page numbers."],
        [15, "Expose it as a FastAPI endpoint and add a minimal HTML chat page."],
        [10, "Write 15 test questions, record how many are answered correctly, and note the failures."],
      ),
      resume_bullet:
        "Built a retrieval-augmented Q&A assistant (FastAPI, ChromaDB, sentence-transformers) over course PDFs with page-level citations; evaluated on a [N]-question test set.",
    },
    advanced: {
      title: "Interview Coach with Rubric Scoring",
      problem:
        "Mock interview bots give vague praise. Build an assistant that asks role-specific questions, scores each answer against an explicit rubric, and returns structured, comparable feedback.",
      stack: ["Python", "FastAPI", "LLM API (structured output)", "PostgreSQL", "React"],
      build_plan: plan(
        [10, "Define a JSON rubric (correctness, depth, clarity) and a question bank for one role."],
        [15, "Call the LLM with structured output so every answer returns scores and one improvement tip."],
        [10, "Persist sessions and scores in PostgreSQL so progress can be compared across attempts."],
        [15, "Build a React screen showing the question, the answer box and a score breakdown."],
        [10, "Score 10 sample answers twice and measure how consistent the rubric scores are."],
      ),
      resume_bullet:
        "Designed an LLM interview coach with rubric-based structured scoring (FastAPI, PostgreSQL, React); measured score consistency across repeated evaluations of [N] answers.",
    },
  },
  vision: {
    beginner: {
      title: "Attendance Photo Counter",
      problem:
        "Counting heads in a classroom photo is slow and error-prone. Build an app that takes a photo and returns the number of people detected, with boxes drawn so mistakes are visible.",
      stack: ["Python", "OpenCV", "Ultralytics YOLO", "Streamlit"],
      build_plan: plan(
        [5, "Install Ultralytics and run the pretrained YOLO model on one sample image."],
        [15, "Filter detections to the 'person' class and draw boxes with OpenCV."],
        [15, "Wrap it in a Streamlit page with an image uploader and a count display."],
        [15, "Test on 8 photos with different lighting and angles; record the true and predicted counts."],
        [10, "Add a confidence slider and write down where the model fails."],
      ),
      resume_bullet:
        "Built a people-counting web app using a pretrained YOLO model (Python, OpenCV, Streamlit); documented accuracy across [N] test photos and its failure cases.",
    },
    intermediate: {
      title: "Lab Safety Gear Detector",
      problem:
        "Labs and workshops rely on someone noticing missing safety gear. Fine-tune a small detector that flags whether a person is wearing a helmet or goggles in a webcam frame.",
      stack: ["Python", "Ultralytics YOLO", "Roboflow dataset", "OpenCV", "Gradio"],
      build_plan: plan(
        [10, "Download a labelled helmet/goggles dataset and inspect 20 samples for label quality."],
        [20, "Fine-tune a YOLO nano model for a few epochs on a free GPU notebook."],
        [10, "Read precision and recall from the validation run and pick a confidence threshold."],
        [10, "Run the model on a webcam stream with OpenCV and overlay a pass/fail banner."],
        [10, "Package it as a Gradio demo and note two cases where it is wrong."],
      ),
      resume_bullet:
        "Fine-tuned a YOLO detector for safety-gear compliance and shipped a live webcam demo (OpenCV, Gradio); reported precision/recall of [P]/[R] on held-out images.",
    },
    advanced: {
      title: "Receipt-to-Expense Extractor",
      problem:
        "Typing receipts into a spreadsheet is tedious and OCR alone returns unstructured text. Build a pipeline that turns a receipt photo into validated JSON: vendor, date, line items and total.",
      stack: ["Python", "Vision LLM API", "Pydantic", "FastAPI", "SQLite"],
      build_plan: plan(
        [10, "Collect 15 receipt photos and hand-label the correct totals as ground truth."],
        [15, "Send each image to a vision model and require output that matches a Pydantic schema."],
        [10, "Add checks: line items must sum to the total; flag the receipt for review if not."],
        [15, "Serve it with FastAPI, store results in SQLite and add an upload page."],
        [10, "Compute field-level accuracy against your labels and list the top error types."],
      ),
      resume_bullet:
        "Built a vision-LLM receipt extraction pipeline with schema validation and arithmetic checks (FastAPI, Pydantic); achieved [X]% field-level accuracy on [N] labelled receipts.",
    },
  },
  prediction: {
    beginner: {
      title: "Placement Readiness Predictor",
      problem:
        "Students have no simple way to see which factors move their placement chances. Train a small model on an open placement dataset and build a page where changing CGPA, skills or internships updates the prediction.",
      stack: ["Python", "pandas", "scikit-learn", "Streamlit"],
      build_plan: plan(
        [10, "Load an open campus-placement dataset with pandas and check for missing values."],
        [15, "Train a logistic regression model and print its accuracy on a held-out 20% split."],
        [10, "Plot which features matter most and write one sentence on each."],
        [15, "Build a Streamlit form with sliders that shows the predicted probability."],
        [10, "Add a note on what the model cannot know, and deploy it."],
      ),
      resume_bullet:
        "Trained and deployed a placement-outcome classifier (scikit-learn, Streamlit) with [X]% held-out accuracy and an interactive what-if interface.",
    },
    intermediate: {
      title: "Hostel Mess Demand Forecaster",
      problem:
        "Mess kitchens over-cook on some days and run out on others. Build a forecaster that predicts tomorrow's meal count from the day of week, exams and holidays, and compare it against a naive baseline.",
      stack: ["Python", "pandas", "XGBoost", "Plotly", "Streamlit"],
      build_plan: plan(
        [10, "Create or collect 90 days of meal counts and add calendar features."],
        [10, "Build the baseline: predict the same value as the same weekday last week."],
        [15, "Train an XGBoost regressor with a time-based train/test split."],
        [15, "Chart forecast vs actual in Plotly and report MAE for the model and the baseline."],
        [10, "Wrap it in a Streamlit page that shows tomorrow's forecast with a range."],
      ),
      resume_bullet:
        "Built a demand forecaster (XGBoost, pandas) that reduced mean absolute error by [X]% against a weekly-naive baseline, using a time-based validation split.",
    },
    advanced: {
      title: "Explainable Loan Default Model",
      problem:
        "A model that only outputs 'reject' is unusable in practice. Build a default-risk model that explains each prediction and check whether it behaves differently across groups.",
      stack: ["Python", "LightGBM", "SHAP", "FastAPI", "Docker"],
      build_plan: plan(
        [10, "Load a public credit dataset, handle class imbalance and define the evaluation metric."],
        [15, "Train LightGBM with cross-validation and report ROC-AUC and recall at a fixed threshold."],
        [15, "Generate SHAP explanations and return the top three reasons with each prediction."],
        [10, "Compare error rates across two demographic groups and document the gap."],
        [10, "Serve the model and explanations through a FastAPI endpoint in a Docker container."],
      ),
      resume_bullet:
        "Developed an explainable credit-risk model (LightGBM, SHAP) with ROC-AUC [X], per-prediction reason codes and a documented group-fairness check; served via FastAPI in Docker.",
    },
  },
  automation: {
    beginner: {
      title: "Resume-to-JD Matcher",
      problem:
        "Students send the same resume to every company and never learn why it is rejected. Build a tool that compares a resume with a job description and lists matching skills, missing skills and three concrete edits.",
      stack: ["Python", "Streamlit", "LLM API", "PyPDF"],
      build_plan: plan(
        [5, "Set up the project and read a resume PDF into text with PyPDF."],
        [15, "Write a prompt that returns matched skills, missing skills and three edits as a list."],
        [20, "Build a Streamlit page: upload resume, paste job description, show the three sections."],
        [10, "Try it on three different job descriptions and tighten the prompt where it is vague."],
        [10, "Deploy it and add a line telling users what data is and is not stored."],
      ),
      resume_bullet:
        "Built an LLM-powered resume-to-job-description matcher (Python, Streamlit) that surfaces skill gaps and targeted edits; tested across [N] job descriptions.",
    },
    intermediate: {
      title: "Inbox Triage Agent",
      problem:
        "Important emails (interview calls, deadlines) get lost among newsletters. Build an agent that reads new emails, labels them by urgency and drafts a reply for the ones that need action, without sending anything itself.",
      stack: ["Python", "Gmail API", "LLM API (tool use)", "SQLite"],
      build_plan: plan(
        [10, "Connect to the Gmail API with read-only scope and fetch the last 20 emails."],
        [15, "Classify each email into urgent / later / ignore using structured output."],
        [15, "For urgent emails, generate a draft reply and save it as a Gmail draft, never sending."],
        [10, "Log every decision in SQLite so you can review what the agent did and why."],
        [10, "Check 20 classifications by hand and record the error rate."],
      ),
      resume_bullet:
        "Built an email triage agent (Gmail API, LLM tool use) that classifies urgency and drafts replies with a human-approval step; [X]% classification accuracy on [N] hand-checked emails.",
    },
    advanced: {
      title: "Research Agent with Cited Reports",
      problem:
        "Single-prompt answers to research questions are shallow and unsourced. Build an agent that plans sub-questions, searches the web, and writes a short report where every claim links to its source.",
      stack: ["Python", "LLM API (tool use)", "Search API", "FastAPI", "Redis"],
      build_plan: plan(
        [10, "Define two tools, search and fetch-page, with strict input schemas."],
        [15, "Implement the agent loop: plan, call tools, stop after a fixed step budget."],
        [15, "Force the final report to cite a fetched URL for each claim and reject uncited claims."],
        [10, "Cache fetched pages in Redis and expose the agent through a FastAPI endpoint."],
        [10, "Run five questions, check ten citations by hand and record how many hold up."],
      ),
      resume_bullet:
        "Built a tool-using research agent with a bounded planning loop and enforced citations (FastAPI, Redis); [X] of [N] sampled citations verified correct on manual review.",
    },
  },
  recsys: {
    beginner: {
      title: "Elective Recommender",
      problem:
        "Choosing electives is guesswork based on what seniors say. Build a recommender that suggests electives similar to subjects a student already enjoyed, based on course descriptions.",
      stack: ["Python", "pandas", "scikit-learn (TF-IDF)", "Streamlit"],
      build_plan: plan(
        [10, "Collect titles and descriptions for 30 electives in a CSV file."],
        [15, "Convert descriptions to TF-IDF vectors and compute cosine similarity."],
        [15, "Write a function that returns the five most similar courses to a chosen one."],
        [10, "Build a Streamlit page with a dropdown and a results list with similarity scores."],
        [10, "Ask three classmates whether the suggestions make sense and note their feedback."],
      ),
      resume_bullet:
        "Built a content-based elective recommender (TF-IDF, cosine similarity, Streamlit) over [N] course descriptions; validated suggestions with peer feedback.",
    },
    intermediate: {
      title: "Semantic Search for Project Reports",
      problem:
        "Keyword search over past project reports misses work that uses different words for the same idea. Build a semantic search that finds reports by meaning and compare it with keyword search.",
      stack: ["Python", "Sentence-Transformers", "FAISS", "FastAPI", "React"],
      build_plan: plan(
        [10, "Gather 100 project abstracts and embed them with a sentence-transformer."],
        [10, "Index the vectors in FAISS and return the top five results for a query."],
        [15, "Build a FastAPI search endpoint and a small React results page."],
        [15, "Write 10 queries with known relevant reports; compare hit rate against keyword search."],
        [10, "Add a 'similar reports' link on each result."],
      ),
      resume_bullet:
        "Built semantic search over [N] project abstracts (sentence-transformers, FAISS, FastAPI) that improved top-5 hit rate from [A]% to [B]% versus keyword search.",
    },
    advanced: {
      title: "Two-Stage Internship Recommender",
      problem:
        "Showing every student the same internship list wastes attention. Build a two-stage recommender: fast retrieval of candidates, then a re-ranker that orders them for the individual student, evaluated offline.",
      stack: ["Python", "PyTorch", "FAISS", "LightGBM ranker", "FastAPI"],
      build_plan: plan(
        [10, "Prepare a public job-interaction dataset with a leave-last-out split."],
        [15, "Train a two-tower embedding model and retrieve 100 candidates per user with FAISS."],
        [15, "Train a LightGBM ranker on the candidates using user and job features."],
        [10, "Report Recall@100 for retrieval and NDCG@10 before and after re-ranking."],
        [10, "Serve recommendations through a FastAPI endpoint with a latency measurement."],
      ),
      resume_bullet:
        "Implemented a two-stage recommender (two-tower retrieval, LightGBM re-ranking) that raised NDCG@10 from [A] to [B] on a public job-interaction dataset; served via FastAPI at [X] ms p95.",
    },
  },
  voice: {
    beginner: {
      title: "Lecture Notes from Audio",
      problem:
        "Recorded lectures are rarely revisited because listening again takes too long. Build a tool that turns a lecture recording into a transcript, a five-point summary and three quiz questions.",
      stack: ["Python", "Whisper", "LLM API", "Streamlit"],
      build_plan: plan(
        [10, "Transcribe a 5-minute lecture clip with the open-source Whisper model."],
        [15, "Send the transcript to an LLM and ask for a five-point summary and three quiz questions."],
        [15, "Build a Streamlit page with an audio uploader and three output tabs."],
        [10, "Test on two different lecturers and note transcription errors."],
        [10, "Add a download-as-text button and deploy."],
      ),
      resume_bullet:
        "Built a lecture-to-notes tool (Whisper, LLM API, Streamlit) that produces transcripts, summaries and quiz questions from audio; tested on [N] recordings.",
    },
    intermediate: {
      title: "Voice Assistant for Campus FAQs",
      problem:
        "Typing is a barrier for quick questions on a phone. Build a voice assistant that listens to a question, answers from a campus FAQ, and speaks the answer back, and measure how long a full turn takes.",
      stack: ["Python", "Whisper", "LLM API", "Text-to-speech API", "Gradio"],
      build_plan: plan(
        [10, "Record microphone audio in Gradio and transcribe it with Whisper."],
        [15, "Answer from a 30-entry FAQ file, refusing when the FAQ does not cover the question."],
        [10, "Convert the answer to speech and play it in the browser."],
        [15, "Time each stage (speech-to-text, LLM, text-to-speech) and find the slowest."],
        [10, "Reduce the slowest stage, for example with a smaller Whisper model, and re-measure."],
      ),
      resume_bullet:
        "Built an end-to-end voice assistant (Whisper, LLM, TTS) for campus FAQs and cut response latency from [A]s to [B]s by profiling each pipeline stage.",
    },
    advanced: {
      title: "Meeting Minutes with Speaker Labels",
      problem:
        "Team meeting recordings produce transcripts nobody reads. Build a pipeline that separates speakers, transcribes the audio and outputs decisions and action items with an owner for each.",
      stack: ["Python", "Whisper", "pyannote.audio", "LLM API (structured output)", "FastAPI"],
      build_plan: plan(
        [10, "Run speaker diarisation on a 10-minute multi-speaker recording."],
        [15, "Transcribe with Whisper and align each segment with its speaker label."],
        [15, "Extract decisions and action items as JSON with owner and due date fields."],
        [10, "Serve the pipeline as an asynchronous FastAPI job with a status endpoint."],
        [10, "Compare extracted action items against a hand-written list and record precision and recall."],
      ),
      resume_bullet:
        "Built a meeting-minutes pipeline (Whisper, pyannote diarisation, structured LLM extraction) with [P]/[R] precision/recall on action items against a hand-labelled reference.",
    },
  },
};

// One sentence that ties the project to the student's own branch.
const BRANCH_ANGLE: Record<Branch, string> = {
  CSE: "As a CSE student, put the code on GitHub with a clear README: interviewers will open it.",
  IT: "As an IT student, deploy it on a public URL so you can demo it live in an interview.",
  "AI & DS": "As an AI & DS student, add a short evaluation section: what you measured and what it showed.",
  ECE: "As an ECE student, try feeding it data from a sensor or signal you already use in your labs.",
  EEE: "As an EEE student, try it on power or energy data, such as load or meter readings.",
  Mechanical: "As a Mechanical student, point it at a manufacturing or maintenance example from your coursework.",
  Civil: "As a Civil student, use a construction or site example, such as inspection photos or project documents.",
  Other: "Use an example from your own field as the dataset: that is what makes it your project.",
};

const DIFFICULTY: Record<SkillLevel, Difficulty> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function fallbackBlueprint(input: BlueprintInput): Blueprint {
  const template = TEMPLATES[input.interest][input.skill_level];
  return {
    ...template,
    problem: `${template.problem} ${BRANCH_ANGLE[input.branch]}`,
    difficulty: DIFFICULTY[input.skill_level],
  };
}
