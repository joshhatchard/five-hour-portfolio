import granic from "./granic";
import canvas from "./canvas";
import sudataMerchandise from "./sudata-merchandise";
import sudataLogoRedesign from "./sudata-logo-redesign";
import projectThree from "./project-three";
import posterSeries from "./poster-series";
import smallSymbols from "./small-symbols";
import colourStudy from "./colour-study";

export const projects = [
  granic,
  canvas,
  projectThree,
  sudataMerchandise,
  sudataLogoRedesign,
  posterSeries,
  smallSymbols,
  colourStudy,
];

export const getProject = (slug: string) => projects.find(project => project.slug === slug);
