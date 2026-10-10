import projectOne from "./project-one";
import projectTwo from "./project-two";
import projectThree from "./project-three";
import typeStudy from "./type-study";
import shapePlay from "./shape-play";
import posterSeries from "./poster-series";
import smallSymbols from "./small-symbols";
import colourStudy from "./colour-study";

export const projects = [projectOne, projectTwo, projectThree, typeStudy, shapePlay, posterSeries, smallSymbols, colourStudy];

export const getProject = (slug: string) => projects.find(project => project.slug === slug);
