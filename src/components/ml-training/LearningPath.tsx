import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GraduationCap,
  ExternalLink,
  BookOpen,
  Award,
  Clock,
  DollarSign,
  Cpu,
  Cloud,
  Database,
  Sparkles,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  provider: string;
  duration: string;
  price: string;
  level: "Foundation" | "Core" | "Stack-specific" | "Reference";
  url: string;
  description: string;
  tags: string[];
  recommended?: boolean;
}

const COURSES: Course[] = [
  {
    id: "made-with-ml",
    title: "Made With ML — MLOps Course",
    provider: "Goku Mohandas",
    duration: "1 month",
    price: "Free",
    level: "Foundation",
    url: "https://madewithml.com",
    description: "End-to-end MLOps: experimentation → production with Ray, MLflow, Airflow, FastAPI.",
    tags: ["MLflow", "Ray", "Airflow", "FastAPI"],
    recommended: true,
  },
  {
    id: "deeplearning-mlops",
    title: "MLOps Specialization",
    provider: "DeepLearning.AI / Coursera (Andrew Ng)",
    duration: "4 months",
    price: "$49/mo",
    level: "Core",
    url: "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops",
    description: "Designing ML pipelines, TFX, feature stores, drift monitoring, CI/CD for ML.",
    tags: ["TFX", "Pipelines", "Monitoring", "CI/CD"],
    recommended: true,
  },
  {
    id: "fsdl",
    title: "Full Stack Deep Learning",
    provider: "UC Berkeley",
    duration: "Self-paced",
    price: "Free",
    level: "Core",
    url: "https://fullstackdeeplearning.com",
    description: "Lectures from OpenAI, Tesla, Weights & Biases engineers. Closest to AI Smart Well stack.",
    tags: ["Production ML", "LLMs", "Infrastructure"],
  },
  {
    id: "datatalks-mlops",
    title: "MLOps Zoomcamp",
    provider: "DataTalks.Club",
    duration: "9 weeks",
    price: "Free",
    level: "Core",
    url: "https://github.com/DataTalksClub/mlops-zoomcamp",
    description: "MLflow, Prefect, Kubernetes, model deployment and monitoring.",
    tags: ["Prefect", "Kubernetes", "MLflow"],
  },
  {
    id: "datatalks-de",
    title: "Data Engineering Zoomcamp",
    provider: "DataTalks.Club",
    duration: "9 weeks",
    price: "Free",
    level: "Stack-specific",
    url: "https://github.com/DataTalksClub/data-engineering-zoomcamp",
    description: "Airflow, Spark, dbt, BigQuery — foundation for our data pipeline.",
    tags: ["Airflow", "Spark", "dbt"],
  },
  {
    id: "nvidia-dli",
    title: "NVIDIA Deep Learning Institute",
    provider: "NVIDIA",
    duration: "Per course",
    price: "$30–90",
    level: "Stack-specific",
    url: "https://courses.nvidia.com",
    description: "GPU acceleration, CUDA, cuQuantum, Triton Inference Server — directly relevant to Stage 7 QAE.",
    tags: ["CUDA", "cuQuantum", "Triton"],
    recommended: true,
  },
  {
    id: "aws-ml",
    title: "AWS Certified Machine Learning Engineer",
    provider: "AWS Skill Builder",
    duration: "2–3 months",
    price: "Free training, $300 exam",
    level: "Stack-specific",
    url: "https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/",
    description: "SageMaker, EKS, deploying ML on AWS — matches our Python ML proxy architecture.",
    tags: ["AWS", "SageMaker", "EKS"],
  },
  {
    id: "yandex-practicum",
    title: "ML Engineer (RU)",
    provider: "Yandex Practicum",
    duration: "8 months",
    price: "Paid",
    level: "Core",
    url: "https://practicum.yandex.ru/ml-engineer/",
    description: "Russian-language program with mentor and real projects.",
    tags: ["Russian", "Mentor", "Projects"],
  },
  {
    id: "otus-mlops",
    title: "MLOps (RU)",
    provider: "OTUS",
    duration: "5 months",
    price: "Paid",
    level: "Stack-specific",
    url: "https://otus.ru/lessons/mlops/",
    description: "Instructors from Sber, Yandex, X5. Russian-language.",
    tags: ["Russian", "MLOps"],
  },
  {
    id: "huyen-book",
    title: "Designing Machine Learning Systems",
    provider: "Chip Huyen (O'Reilly)",
    duration: "Reference",
    price: "$45",
    level: "Reference",
    url: "https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/",
    description: "The ML engineer bible. Must-read for system design interviews and production work.",
    tags: ["Book", "System Design"],
    recommended: true,
  },
  {
    id: "burkov-book",
    title: "Machine Learning Engineering",
    provider: "Andriy Burkov",
    duration: "Reference",
    price: "$35",
    level: "Reference",
    url: "http://www.mlebook.com/",
    description: "Practical ML engineering handbook covering the full lifecycle.",
    tags: ["Book", "Lifecycle"],
  },
];

const LEVEL_META: Record<Course["level"], { color: string; icon: typeof BookOpen }> = {
  Foundation: { color: "bg-primary/15 text-primary border-primary/30", icon: Sparkles },
  Core: { color: "bg-accent/15 text-accent border-accent/30", icon: GraduationCap },
  "Stack-specific": { color: "bg-warning/15 text-warning border-warning/30", icon: Cpu },
  Reference: { color: "bg-muted text-muted-foreground border-border", icon: BookOpen },
};

const STORAGE_KEY = "ml-learning-path-progress";

const LearningPath = () => {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch {
      // ignore
    }
  }, []);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const progress = (completed.size / COURSES.length) * 100;

  const grouped = (["Foundation", "Core", "Stack-specific", "Reference"] as const).map((level) => ({
    level,
    items: COURSES.filter((c) => c.level === level),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-6 w-6 text-primary" />
                Learning Path: ML Pipeline Engineer
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                Curated 6–8 month roadmap to design and operate the AI Smart Well 9-stage ML pipeline.
                Track your progress through foundational, core, and stack-specific courses.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              {completed.size} / {COURSES.length} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Step 1: Foundation (1 mo)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Step 2: Core MLOps (3–4 mo)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">Step 3: Stack (parallel)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Step 4: References</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped courses */}
      {grouped.map(({ level, items }) => {
        const meta = LEVEL_META[level];
        const Icon = meta.icon;
        return (
          <div key={level}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {level}
              </h3>
              <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
                {items.length} {items.length === 1 ? "course" : "courses"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((course) => {
                const isDone = completed.has(course.id);
                return (
                  <Card
                    key={course.id}
                    className={`transition-all ${
                      isDone ? "border-success/40 bg-success/5" : "hover:border-primary/40"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => toggle(course.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-tight">
                              {course.title}
                            </CardTitle>
                            {course.recommended && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] flex-shrink-0">
                                ★ Recommended
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1 text-xs">
                            {course.provider}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {course.tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {course.price}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-7 text-xs"
                        >
                          <a href={course.url} target="_blank" rel="noopener noreferrer">
                            Open
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Stack mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            How courses map to AI Smart Well stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-warning" /> Stage 7 QAE
              </div>
              <p className="text-xs text-muted-foreground">
                NVIDIA DLI — cuQuantum & quantum simulation acceleration
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-accent" /> AWS Python ML proxy
              </div>
              <p className="text-xs text-muted-foreground">
                AWS ML Engineer — SageMaker for heavy Python ML offloaded from Edge
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-primary" /> 9-stage pipeline
              </div>
              <p className="text-xs text-muted-foreground">
                DataTalks Zoomcamps — Airflow/Prefect for stage orchestration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningPath;
