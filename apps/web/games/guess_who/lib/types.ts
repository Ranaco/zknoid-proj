import { Bool, CircuitString, Provable, Struct, UInt64 } from "o1js";

export const Trait = [
    "necklace",
    "glasses",
    "earrings",
    "bald",
    "beard",
    "moustache",
    "blonde_hair",
    "black_hair",
    "brown_hair",
    "bandana",
    "band",
    "tie",
    "mouth_open",
    "bunny_ears",
    "male",
];

export const questions: string[] = [
    'Is your character a male?',
    'Is your character wearing glasses?',
    'Is your character have a moustache?',
    'Is your character wearing bunny_ears?',
    'Is your character bald?',
    'Does your character have blonde_hair?',
    'Does your character have black_hair?',
    'Does your character have brown_hair?',
    'Does your character have a beard?',
    'Is your character wearing a bandana?',
    'Is your character wearing a band?',
    'is your character wearing earrings?',
    'Is your character wearing a tie?',
    'Is your character wearing a necklace?',
    'Does your character have mouth_open?',
];

export class CharacterInfo extends Struct({
    id: UInt64,
    name: CircuitString,
    traits: Provable.Array(UInt64, 4),
    pos: UInt64,
    isPicked: Bool,
    isCancelled: Bool,
}) {

}

export const characters: CharacterInfo[] = [
    {
        id: UInt64.from(0),
        name: CircuitString.fromString("Chantal"),
        traits: [UInt64.from(1), UInt64.from(0), UInt64.from(2), UInt64.from(8), UInt64.from(12)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(1),
        name: CircuitString.fromString("Eric"),
        traits: [UInt64.from(3), UInt64.from(13), UInt64.from(4), UInt64.from(5), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(2),
        name: CircuitString.fromString("Alex"),
        traits: [UInt64.from(11), UInt64.from(12), UInt64.from(6), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(3),
        name: CircuitString.fromString("Bob"),
        traits: [UInt64.from(13), UInt64.from(4), UInt64.from(6), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(4),
        name: CircuitString.fromString("Paul"),
        traits: [UInt64.from(9), UInt64.from(5), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(5),
        name: CircuitString.fromString("Frank"),
        traits: [UInt64.from(2), UInt64.from(10), UInt64.from(12), UInt64.from(5), UInt64.from(7), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(6),
        name: CircuitString.fromString("Zoe"),
        traits: [UInt64.from(1), UInt64.from(0), UInt64.from(2), UInt64.from(8), UInt64.from(12)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(7),
        name: CircuitString.fromString("Joe"),
        traits: [UInt64.from(1), UInt64.from(3), UInt64.from(5), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(8),
        name: CircuitString.fromString("Buba"),
        traits: [UInt64.from(2), UInt64.from(10), UInt64.from(7)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(9),
        name: CircuitString.fromString("Rita"),
        traits: [UInt64.from(1), UInt64.from(2), UInt64.from(11)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(10),
        name: CircuitString.fromString("Rick"),
        traits: [UInt64.from(1), UInt64.from(11), UInt64.from(4), UInt64.from(5), UInt64.from(6), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(11),
        name: CircuitString.fromString("Antoine"),
        traits: [UInt64.from(5), UInt64.from(8), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(12),
        name: CircuitString.fromString("John"),
        traits: [UInt64.from(1), UInt64.from(7), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(13),
        name: CircuitString.fromString("Chap"),
        traits: [UInt64.from(1), UInt64.from(2), UInt64.from(3), UInt64.from(4), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(14),
        name: CircuitString.fromString("Evelyn"),
        traits: [UInt64.from(0), UInt64.from(2)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(15),
        name: CircuitString.fromString("Lady"),
        traits: [UInt64.from(1), UInt64.from(2), UInt64.from(8)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(16),
        name: CircuitString.fromString("Samantha"),
        traits: [UInt64.from(0), UInt64.from(2), UInt64.from(9), UInt64.from(6)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(17),
        name: CircuitString.fromString("Jenny"),
        traits: [UInt64.from(1), UInt64.from(2)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(18),
        name: CircuitString.fromString("Javier"),
        traits: [UInt64.from(0), UInt64.from(10), UInt64.from(5), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(19),
        name: CircuitString.fromString("Evan"),
        traits: [UInt64.from(5), UInt64.from(6), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(20),
        name: CircuitString.fromString("Mathias"),
        traits: [UInt64.from(1), UInt64.from(3), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(21),
        name: CircuitString.fromString("Michael"),
        traits: [UInt64.from(2), UInt64.from(11), UInt64.from(6), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(22),
        name: CircuitString.fromString("Hank"),
        traits: [UInt64.from(0), UInt64.from(11), UInt64.from(13), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
    {
        id: UInt64.from(23),
        name: CircuitString.fromString("Vito"),
        traits: [UInt64.from(1), UInt64.from(3), UInt64.from(4), UInt64.from(14)],
        pos: UInt64.from(0),
        isPicked: Bool(false),
        isCancelled: Bool(false)
    },
];