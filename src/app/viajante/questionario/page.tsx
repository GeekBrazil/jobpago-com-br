import type { Metadata } from "next";
import CidadeTopo from "../../cidade/CidadeTopo";
import FormQuestionario from "./FormQuestionario";

export const metadata: Metadata = {
  title: "Questionário do viajante · Cuestionario del viajero · Traveller questionnaire · JobPago",
  description: "Conte como você viaja pelo Brasil e o que é mais difícil. Contanos cómo viajás por Brasil. Tell us how you travel around Brazil.",
};

export default function QuestionarioPage() {
  return (
    <div className="min-h-screen text-slate-100">
      <CidadeTopo />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <FormQuestionario />
      </main>
    </div>
  );
}
