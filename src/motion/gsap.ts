// GSAP singleton with the plugins MOTION_SPEC section 1 requires. Registering
// once here keeps every motion module on the same plugin instances.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(
  ScrollTrigger,
  Flip,
  SplitText,
  Draggable,
  MorphSVGPlugin,
  CustomEase,
  Observer,
);

export { gsap, ScrollTrigger, Flip, SplitText, Draggable, MorphSVGPlugin, CustomEase, Observer };
