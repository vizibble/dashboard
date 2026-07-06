import { generateId } from "./blockFactory";

const style = {
        width: "100%",
        padding: 4,
        backgroundColor: "#ffffff",
        color: "#000000",}

export const createColumn = () => {

    const column = {
        id:generateId(),
        type: "column",
        props:{style:{...style, height:"100%"}},
        children:[]
    }
    return column;       
}

export const createRowWithColumns = (count:number) => {
    const columns = []
    for(let i = 0; i < count; i++){
        columns.push(createColumn())
    }

    return createRow(columns);
}

export const createRow = (columns:any) =>({
    id: generateId(),
    type: "row",
    props:{style:{...style, height:"200px"}},
    children: columns
})