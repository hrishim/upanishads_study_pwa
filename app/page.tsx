import chandogya from "@/WebApp/data/chandogya_upanishad_full.json";
import isha from "@/WebApp/data/isha_upanishad_full.json";
import kaivalya from "@/WebApp/data/kaivalya_upanishad_full.json";
import katha from "@/WebApp/data/katha_upanishad_full.json";
import kena from "@/WebApp/data/kena_upanishad_full.json";
import type { Metadata } from "next";
import mandukya from "@/WebApp/data/mandukya_upanishad_full.json";
import mundaka from "@/WebApp/data/mundaka_upanishad_full.json";
import taittiriya from "@/WebApp/data/taittiriya_upanishad_full.json";
import { PwaRegister } from "./PwaRegister";
import { UpanishadStudyApp } from "./UpanishadStudyApp";

export const metadata: Metadata = {
  title: "Upanishads Study",
  description: "A full text study app for the Upanishads, beginning with Mundaka Upanishad.",
};

export default function Home() {
  return (
    <>
      <PwaRegister />
      <UpanishadStudyApp dataSets={[mundaka, mandukya, isha, kena, katha, kaivalya, taittiriya, chandogya]} />
    </>
  );
}
