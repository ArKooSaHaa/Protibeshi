import placeText from './place.md?raw';

const parsePlaceList = (text: string): string[] => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('* '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
};

const PLACE_LIST = parsePlaceList(placeText);

export const getPlaceList = (): string[] => PLACE_LIST;
