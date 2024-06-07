import React, { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";


interface StatefulComponentState {
    inputArray: string[][];
    structureArray: number[][][];
    cellSelected: string;
}

const Spreadsheet: React.FC = () => {
    const [inputArray, setInputArray] = useState<string[][]>([]);
    const [structureArray, setStructureArray] = useState<number[][][]>([]);
    const [cellSelected, setCellSelected] = useState<string>('');
    const [columnMenuVisibility, setColumnMenuVisibility] = useState<Boolean>(false);
    const [rowMenuVisibility, setRowMenuVisibility] = useState<Boolean>(false);
    const [cellMenuVisibility, setCellMenuVisibility] = useState<Boolean>(false);
    const [mergeModalStatus, setMergeModalStatus] = useState<Boolean>(false);

    useEffect(() => {
        setStructureArray(Array.from({length: 10}, () => Array(10).fill([1,1])))
        setInputArray(Array.from({length: 10}, () => Array(10).fill('')))
    }, [])

    useEffect(() => {
        hljs.highlightAll();
    });

    // with a given array of matched indexes of row/column that don't contain [1,1]
    // find and filter out indexes that is an increasing sequence (column on index 1) and return only the left most column index in possible merged cell structure
    function findIncreasingSequenceRow(array: number[][]) {
        if (array.length === 1) {
            return array
        }
        let firstValues = [];
        for (let i = 0; i < array.length - 1; i++) {
            if (array[i][1] < array[i + 1][1] && (i === 0 || array[i][1] !== array[i - 1][1] + 1)) {
                firstValues.push(array[i]);
            }
        }
            // Check the last element if it's part of an increasing sequence
        if (array.length > 1 && array[array.length - 1][1] > array[array.length - 2][1]) {
            firstValues.push(array[array.length - 1]);
        }
        return firstValues;
    }

    // with the given array of matched and filtered row/column indexes
    // find the exact row index where the merge value is stored by finding the first matched non-0 structure value by going upward (row)
    function findMergedCellStartingIndexRowAbove(array: number[][]) {
        const loopLength = array.length;
        const finalArray = []
        for (let i = 0; i < loopLength; i++) {
            const rowPosition = array[i][0]
            const columnPosition = array[i][1]
            for (let j = rowPosition; j > -1; j--) {
                if (structureArray[j][columnPosition][0] !== 0) {
                    finalArray.push([j, columnPosition])
                    break
                }
            }
        }
        return finalArray;
    }

    // with a given array of matched indexes of row/column that don't contain [1,1]
    // find and filter out indexes that is an increasing sequence (row on index 0) and return only the left most column index in possible merged cell structure
    function findIncreasingSequenceColumn(array: number[][]) {
        if (array.length === 1) {
            return array
        }
        let firstValues = [];
        for (let i = 0; i < array.length - 1; i++) {
            if (array[i][0] < array[i + 1][0] && (i === 0 || array[i][0] !== array[i - 1][0] + 1)) {
                firstValues.push(array[i]);
            }
        }
        // Check the last element if it's part of an increasing sequence
        // if (array.length > 1 && array[array.length - 1][0] > array[array.length - 2][0]) {
        //     firstValues.push(array[array.length - 1]);
        // }
        return firstValues;
    }

    // with the given array of matched and filtered row/column indexes
    // find the exact row index where the merge value is stored by finding the first matched non-0 structure value by going leftward (column)
    function findMergedCellStartingIndexColumnLeft(array: number[][]) {
        const loopLength = array.length;
        const finalArray = []
        for (let i = 0; i < loopLength; i++) {
            const rowPosition = array[i][0]
            const columnPosition = array[i][1]
            for (let j = columnPosition; j > -1; j--) {
                if (structureArray[rowPosition][j][0] !== 0) {
                    finalArray.push([rowPosition, j])
                    break
                }
            }
        }
        return finalArray;
    }

    // console.log(structureArray)

    const handleOnSelected = (event: React.MouseEvent): void => {
        let cellIndex: string;
        if ((event.target as Element).nodeName !== "TD") {
            cellIndex = ((event.target as Element)!.parentNode as Element)!.id;
        } else {
            cellIndex = (event.target as Element).id;
        }
        if (cellIndex === cellSelected) {
            setCellSelected('')
        } else {
            setCellSelected(cellIndex)
        }
    }

    const isCellSelected = (cellIndex: string) => {
        return cellIndex === cellSelected
    }

    // console.log(cellSelected)

    const handleColumnMenu = (e: React.MouseEvent): void => {
        if (!cellSelected) {
            return
        }
        // console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        setColumnMenuVisibility(false);
        const currentColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const currentRowIndex: number = parseInt(cellSelected.split('-')[1])

        const shallowCopyStructureArray = [...structureArray]
        const shallowCopyInputArray = [...inputArray]
        const loopLength = inputArray.length;

        // inputArray changes
        for (let i = 0; i < loopLength; i++) {
            if (selectedCommand.includes('remove')) {
                shallowCopyInputArray[i].splice(currentColumnIndex, 1)  
            } else {
                if (selectedCommand.includes('left')) {
                    shallowCopyInputArray[i].splice(currentColumnIndex, 0, '')
                } else if (selectedCommand.includes('right')) {
                    shallowCopyInputArray[i].splice(currentColumnIndex + 1, 0, '')
                }
            }
        }

        // structureArray changes
        if (selectedCommand.includes('left')) {
            console.log('add left')
            // structureArray
            // finding if there's any row affected by removing column at current column index
            // check if structureArray of columnValue at currentColumnIndex and different rowIndexes is not 1
            let listOfCurrentMergePositionIni = []
            for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                if (shallowCopyStructureArray[i][currentColumnIndex][0] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) {
                    listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                }
            }
            // if no matching found, insert new column of [1,1]
            console.log('currentColumnIndex', currentColumnIndex)
            if (listOfCurrentMergePositionIni.length === 0 || currentColumnIndex === 0) {
                let finalInsertArray: number[] = [1, 1]
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 0, finalInsertArray)
                }
                setStructureArray(shallowCopyStructureArray)
            } else {
                // condition #1 -- if there's merged row with starting position on the same column -> don't do anything
                // condition #2 -- if there's merged row with starting position left to selected column -> locate and increment +1 to column value

                console.log('listOfCurrentMergePositionIni', listOfCurrentMergePositionIni) // correct

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0]
                    if (newStartingMergedRowIndex < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                console.log('listOfMergePositionFinal', listOfMergePositionFinal)

                // with the list of starting position for merged cells that are affected by adding new column (left)
                // accessing the structure (column) value and increment by 1
                // if the starting merged cell position is on the same column, inserting column left should not affect therefore it is skipped 
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[1] !== currentColumnIndex) {
                        const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] + 1
                        shallowCopyStructureArray[item[0]][item[1]][1] = newStructureValue
                    }
                })

                // create a new structure column of [1,1]
                // check if structure value at currentColumnIndex - 1 (left side) is not 1 -> meaning it's part of merged cell
                // change affected existing merged cell to [0,0]
                // if a cell/column is the starting merged row, skip it
                let finalInsertArray: number[][] = Array(structureArray.length).fill([1,1])
                for (let i = 0; i < structureArray.length; i++) {
                    // console.log('structureArray[i][currentColumnIndex][0]', structureArray[i][currentColumnIndex][0])
                    if ((structureArray[i][currentColumnIndex - 1][0] !== 1 || structureArray[i][currentColumnIndex - 1][1] !== 1) && (structureArray[i][currentColumnIndex][0] !== 1 || structureArray[i][currentColumnIndex][1] !== 1)) {
                        finalInsertArray.splice(i, 1, [0,0])
                    }
                }

                console.log('finalInsertArray', finalInsertArray) // correct

                // insert structure to column left of selected column index
                for (let i = 0; i < finalInsertArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 0, finalInsertArray[i])
                }

                console.log('shallowCopyStructureArray', shallowCopyStructureArray)
                setStructureArray(shallowCopyStructureArray)
            }
        } else if (selectedCommand.includes('right')) {
            console.log('add right')
            // check if selected cell is a merged cell, if yes, adjust current column to account for merged column value
            const updatedColumnIndex = structureArray[currentRowIndex][currentColumnIndex][1] === 1 ? currentColumnIndex : currentColumnIndex + structureArray[currentRowIndex][currentColumnIndex][1] - 1

            // check if structureArray columnValue at currentColumnIndex + 1 (right) at different rowIndexes is not 1 to see which cell is part of merged cell(s)
            let listOfCurrentMergePositionIni = [] as number[][]
            for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                if ((shallowCopyStructureArray[i][updatedColumnIndex][1] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) && (shallowCopyStructureArray[i][updatedColumnIndex + 1][1] !== 1 || shallowCopyStructureArray[i][currentColumnIndex + 1][1] !== 1)) {
                    listOfCurrentMergePositionIni.push([i, updatedColumnIndex])
                }
            }
            console.log('updatedColumnIndex', updatedColumnIndex)
            console.log('listOfCurrentMergePositionIni', listOfCurrentMergePositionIni)

            // if no matching found, insert new column of [1,1]
            if (listOfCurrentMergePositionIni.length === 0 || updatedColumnIndex === structureArray[0].length - 1) {
                let finalInsertArray: number[] = [1, 1]
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(updatedColumnIndex + 1, 0, finalInsertArray)
                }
                setStructureArray(shallowCopyStructureArray)
            } else {
                // condition #1 -- if there's merged row with starting position on the same column -> locate and increment +1 to column value
                // condition #2 -- if there's merged row with starting position right to selected column -> locate and mark current row for new structure value of[0,0]

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0]
                    if (newStartingMergedRowIndex < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the next left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1 (counter)` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                console.log('listOfMergePositionFinal', listOfMergePositionFinal)

                // with the list of starting position for merged cells that are affected by adding new column (right)
                // accessing the structure (column) value and increment by 1
                listOfMergePositionFinal.forEach((item: number[]) => {
                    const currentColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                    const newColumnStructureValue = currentColumnStructureValue + 1
                    shallowCopyStructureArray[item[0]][item[1]][1] = newColumnStructureValue
                })

                // create a new structure column of [1,1]
                // check if structure value at updatedColumnIndex + 1 (right side) is 0 -> meaning it's part of merged cell 
                // AND structure value at updatedColumnIndex is not 1
                // change affected existing merged cell to [0,0]
                // if a cell/column is the starting merged row, skip it
                let finalInsertArray: number[][] = Array(structureArray.length).fill([1,1])
                for (let i = 0; i < structureArray.length; i++) {
                    if ((structureArray[i][updatedColumnIndex + 1][0] === 0 || structureArray[i][updatedColumnIndex + 1][1] === 0) && (structureArray[i][updatedColumnIndex][0] !== 1 || structureArray[i][updatedColumnIndex][1] !== 1)) {
                        finalInsertArray.splice(i, 1, [0,0])
                    }
                }

                console.log('finalInsertArray', finalInsertArray)

                // insert structure to column left of selected column index
                for (let i = 0; i < finalInsertArray.length; i++) {
                    shallowCopyStructureArray[i].splice(updatedColumnIndex + 1, 0, finalInsertArray[i])
                }

                console.log('shallowCopyStructureArray', shallowCopyStructureArray)
                setStructureArray(shallowCopyStructureArray)
            }
        } else if (selectedCommand.includes('remove')) {
            console.log('remove')
            // structureArray
            // finding if there's any row affected by removing column at current column index
            // check if structureArray of columnValue at currentColumnIndex and different rowIndexes is not 1
            let listOfCurrentMergePositionIni = []
            for (let i = 0; i < shallowCopyStructureArray.length; i++) {
                if (shallowCopyStructureArray[i][currentColumnIndex][1] !== 1 || shallowCopyStructureArray[i][currentColumnIndex][1] !== 1) {
                    listOfCurrentMergePositionIni.push([i, currentColumnIndex])
                }
            }
            console.log('currentColumnIndex', currentColumnIndex)
            console.log('listOfCurrentMergePositionIni', listOfCurrentMergePositionIni) // correct
            // if no matching found, insert new column of [1,1]
            if (listOfCurrentMergePositionIni.length === 0) {
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                }
                setStructureArray(shallowCopyStructureArray)
            } else {
                // condition #1 -- if there's merged row with starting position on the same column -> access columnIndex + 1 (right) change its structure value to [rowValue, columnValue -1]
                // condition #2 -- if there's merged row with starting position left to selected column -> locate and reduce -1 to column value

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedRowIndex: number = listOfCurrentMergePositionIni[0][0]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    console.log('listOfCurrentMergePositionIni[i][0]', listOfCurrentMergePositionIni[i][0])
                    console.log('currentStartingMergedRowIndex', currentStartingMergedRowIndex)
                    let newStartingMergedRowIndex: number = listOfCurrentMergePositionIni[i][0] 
                    if (listOfCurrentMergePositionIni[i][0] < currentStartingMergedRowIndex) continue

                    // going through each affected row, starting at the top, check its structure value, if it's 0 (either col or row) move onto the left column
                    // i.e. `listOfCurrentMergePositionIni[i][1] - 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let currentColumnIndex: number = listOfCurrentMergePositionIni[0][1];
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureRowValue: number = structureArray[newStartingMergedRowIndex][currentColumnIndex - counter][0]
                        if (newStructureRowValue !== 0) {
                            listOfMergePositionFinal.push([newStartingMergedRowIndex, currentColumnIndex - counter])
                            currentStartingMergedRowIndex = newStartingMergedRowIndex + newStructureRowValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                console.log('listOfMergePositionFinal', listOfMergePositionFinal)

                // with the list of starting position for merged cells that are affected by removing current column
                // accessing the structure (column) value and decrease by 1
                // if the starting merged cell position is on the same column, note the row/column index, g
                // rab the structure value of both row and column (-1 for removing current column), 
                // insert the value into the row/column(+1)
                // if currentColumn is the last column, skip it
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[1] === currentColumnIndex) {
                        console.log('matched column')
                        if (currentColumnIndex !== structureArray[0].length) {
                            const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] - 1
                            const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0]
                            // shallowCopyStructureArray[item[0]][item[1] + 1] = [newRowStructureValue, newColumnStructureValue]
                            shallowCopyStructureArray[item[0]].splice(item[1] + 1, 1, [newRowStructureValue, newColumnStructureValue])
                        }
                    } else {
                        const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1] - 1
                        shallowCopyStructureArray[item[0]][item[1]][1] = newColumnStructureValue
                    }
                })

                // insert structure to column left of selected column index
                for (let i = 0; i < structureArray.length; i++) {
                    shallowCopyStructureArray[i].splice(currentColumnIndex, 1)
                }

                console.log('shallowCopyStructureArray', shallowCopyStructureArray)
                setStructureArray(shallowCopyStructureArray)
            }
        }

        setInputArray(shallowCopyInputArray)
        // moving current selected cell to the right (+1)
        if (selectedCommand.includes('left')) {
            const selectedCellArray = cellSelected.split('-')
            selectedCellArray[2] = String(currentColumnIndex + 1)
            setCellSelected(selectedCellArray.join('-'))
        }
    }

    const handleRowMenu = (e: React.MouseEvent) : void => {
        if (!cellSelected) {
            return
        }
        // console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        setRowMenuVisibility(false)
        const currentRowIndex: number = parseInt(cellSelected.split('-')[1])
        const shallowCopyInputArray = [...inputArray]
        const shallowCopyStructureArray = [...structureArray]
        if (selectedCommand.includes('remove')) {
            shallowCopyInputArray.splice(currentRowIndex, 1)
            setInputArray(shallowCopyInputArray)

            // structureArray
            // condition 1: first row
            // --- change all merged row to 2nd row and -1 to structure row value
            // condition 2: last row
            // --- change all merged row that's not on the last row and -1 to structure row value
            // condition 3: any middle row
            // --- change all merged row above that include current row AND move merged cell


            // Condition 1:
            if (currentRowIndex === 0) {
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex + 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex + 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                // if empty, remove row
                if (listOfCurrentMergePositionIni.length === 0) {
                    shallowCopyStructureArray.splice(currentRowIndex, 1)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }
                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                    if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue
                    
                    let newStructureColumnValue: number = structureArray[currentRowIndex][newStartingMergedColumnIndex][1]
                    listOfMergePositionFinal.push([currentRowIndex, newStartingMergedColumnIndex])
                    currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                }

                // with the list of starting position for merged cells that are affected by inserting new row (above)
                // accessing the structure (row) value and increment it by 1
                // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                listOfMergePositionFinal.forEach((item: number[]) => {
                    const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                    const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                    shallowCopyStructureArray[item[0] + 1].splice(item[1], 1, [newRowStructureValue, newColumnStructureValue])
                })
                shallowCopyStructureArray.splice(currentRowIndex, 1)

                setStructureArray(shallowCopyStructureArray)

            }

            // Condition 2:
            else if (currentRowIndex === structureArray.length - 1) {
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex - 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex - 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                // if empty, remove row
                if (listOfCurrentMergePositionIni.length === 0) {
                    shallowCopyStructureArray.splice(currentRowIndex, 1)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                    if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue

                    // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                    // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                        if (newStructureColumnValue !== 0) {
                            listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                            currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                // with the list of starting position for merged cells that are affected by inserting new row (above)
                // accessing the structure (row) value and increment it by 1
                // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[0] !== currentRowIndex) {
                        const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                        shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                    }
                })
                shallowCopyStructureArray.splice(currentRowIndex, 1)

                setStructureArray(shallowCopyStructureArray)
            }
            
            // Condition 3:
            else {
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if (
                        (shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) 
                    && 
                    ((shallowCopyStructureArray[currentRowIndex - 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex - 1][i][1] !== 1) 
                    || (shallowCopyStructureArray[currentRowIndex + 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex + 1][i][1] !== 1))
                    ) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }

                console.log('listOfCurrentMergePositionIni', listOfCurrentMergePositionIni)

                // if empty, remove row
                if (listOfCurrentMergePositionIni.length === 0) {
                    shallowCopyStructureArray.splice(currentRowIndex, 1)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                let listOfMergePositionFinal = [] as number[][]
                let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                    let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                    if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue

                    // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                    // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                    // if structure is not 0, get the row value -> it'll determine the next merge block
                    let condition: boolean = true;
                    let counter: number = 0;
                    while (condition) {
                        let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                        if (newStructureColumnValue !== 0) {
                            listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                            currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                            condition = false
                        } else {
                            counter += 1
                        }
                    }
                }

                console.log('listOfMergePositionFinal', listOfMergePositionFinal)

                // with the list of starting position for merged cells that are affected by inserting new row (above)
                // accessing the structure (row) value and increment it by 1
                // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                listOfMergePositionFinal.forEach((item: number[]) => {
                    if (item[0] !== currentRowIndex) {
                        const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                        shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                    } else if (item[0] === currentRowIndex) {
                        const newRowStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] - 1
                        const newColumnStructureValue = shallowCopyStructureArray[item[0]][item[1]][1]
                        shallowCopyStructureArray[item[0] + 1].splice(item[1], 1, [newRowStructureValue, newColumnStructureValue])
                    }
                })
                shallowCopyStructureArray.splice(currentRowIndex, 1)

                setStructureArray(shallowCopyStructureArray)
            }
        } else {
            const numberOfColumn = inputArray[0].length
            const newRow = Array(numberOfColumn).fill('')
            // --------------------------------- above ------------------------------------
            if (selectedCommand.includes('above')) {
                console.log("add above")
                shallowCopyInputArray.splice(currentRowIndex, 0, newRow)
                const selectedCellArray = cellSelected.split('-')
                selectedCellArray[1] = String(currentRowIndex + 1)
                setCellSelected(selectedCellArray.join('-'))
                setInputArray(shallowCopyInputArray)

                // -------------- structureArray ------------------

                // if selected row is first row, add new row above doesn't affect any merged cells
                if (currentRowIndex === 0) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }

                // finding if there's any column affected by adding new row at current row index
                // check if structureArray of rowValue at currentRowIndex and different columnIndexes isn't 1
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex - 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex - 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex, i])
                    }
                }
                console.log('currentRowIndex', currentRowIndex)
                console.log('listOfCurrentMergePositionIni', listOfCurrentMergePositionIni) // correct

                // if no matching found, insert new row of [1,1]
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                } else {
                    let listOfMergePositionFinal = [] as number[][]
                    let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                    for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                        let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                        if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue
    
                        // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                        // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                        // if structure is not 0, get the row value -> it'll determine the next merge block
                        let condition: boolean = true;
                        let counter: number = 0;
                        while (condition) {
                            let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                            if (newStructureColumnValue !== 0) {
                                listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                                currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                                condition = false
                            } else {
                                counter += 1
                            }
                        }
                    }

                    console.log('listOfMergePositionFinal', listOfMergePositionFinal)
    
                    // create a new structure row of [1,1]
                    // change affected existing merged column to [0,0]
                    // if a cell/column is the starting merged column, skip it
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    listOfCurrentMergePositionIni.forEach((item: number[]) => {
                        if (structureArray[item[0]][item[1]][0] === 0) {
                            finalInsertArray.splice(item[1], 1, [0,0])
                        }
                    })

                    // with the list of starting position for merged cells that are affected by inserting new row (above)
                    // accessing the structure (row) value and increment it by 1
                    // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                    listOfMergePositionFinal.forEach((item: number[]) => {
                        if (item[0] !== currentRowIndex) {
                            const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] + 1
                            shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                        }
                    })
                    shallowCopyStructureArray.splice(currentRowIndex, 0, finalInsertArray)
    
                    setStructureArray(shallowCopyStructureArray)
                }
            } else if (selectedCommand.includes('below')) {
                console.log('add below')
                shallowCopyInputArray.splice(currentRowIndex + 1, 0, newRow)
                setInputArray(shallowCopyInputArray)

                // structureArray
                // if last row, add row below doesn't affect anything, insert new row of [1,1]
                if (currentRowIndex === structureArray.length - 1) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex + 1, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                    return
                }
                // finding if there's any column affected by adding new row at current row index + 1 (for row below)
                // check if structureArray of rowValue at currentRowIndex and different columnIndexes isn't 1
                let listOfCurrentMergePositionIni = []
                for (let i = 0; i < shallowCopyStructureArray[currentRowIndex + 1].length; i++) {
                    if ((shallowCopyStructureArray[currentRowIndex][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex][i][1] !== 1) && (shallowCopyStructureArray[currentRowIndex + 1][i][0] !== 1 || shallowCopyStructureArray[currentRowIndex + 1][i][1] !== 1)) {
                        listOfCurrentMergePositionIni.push([currentRowIndex + 1, i])
                    }
                }
                // if no matching found, insert new row of [1,1]
                if (listOfCurrentMergePositionIni.length === 0) {
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    shallowCopyStructureArray.splice(currentRowIndex + 1, 0, finalInsertArray)
                    setStructureArray(shallowCopyStructureArray)
                } else {
                    let listOfMergePositionFinal = [] as number[][]
                    let currentStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[0][1]
                    for (let i = 0; i < listOfCurrentMergePositionIni.length; i++) {
                        let newStartingMergedColumnIndex: number = listOfCurrentMergePositionIni[i][1]
                        if (newStartingMergedColumnIndex < currentStartingMergedColumnIndex) continue
    
                        // going through each affected column, starting at the left, check its structure value, if it's 0 (either col or row) move onto the row above
                        // i.e. `listOfCurrentMergePositionIni[i][0] + 1` -> check again
                        // if structure is not 0, get the row value -> it'll determine the next merge block
                        let condition: boolean = true;
                        let counter: number = 0;
                        while (condition) {
                            let newStructureColumnValue: number = structureArray[currentRowIndex - counter][newStartingMergedColumnIndex][1]
                            if (newStructureColumnValue !== 0) {
                                listOfMergePositionFinal.push([currentRowIndex - counter, newStartingMergedColumnIndex])
                                currentStartingMergedColumnIndex = newStartingMergedColumnIndex + newStructureColumnValue
                                condition = false
                            } else {
                                counter += 1
                            }
                        }
                    }

                    console.log('listOfMergePositionFinal', listOfMergePositionFinal)
    
                    // create a new structure row of [1,1]
                    // change affected existing merged column to [0,0]
                    // if a cell/column is the starting merged column, skip it
                    let finalInsertArray: number[][] = Array(structureArray[0].length).fill([1,1])
                    listOfCurrentMergePositionIni.forEach((item: number[]) => {
                        if (structureArray[item[0]][item[1]][0] !== 1 && structureArray[item[0] + 1][item[1]][0] !== 1) {
                            finalInsertArray.splice(item[1], 1, [0,0])
                        }
                    })

                    // with the list of starting position for merged cells that are affected by inserting new row (above)
                    // accessing the structure (row) value and increment it by 1
                    // if the starting merged cell position is on the same row, inserting row above should not affect therefore it is skipped
                    listOfMergePositionFinal.forEach((item: number[]) => {
                        if (item[0] + structureArray[item[0]][item[1]][0] - 1 > currentRowIndex) {
                            const newStructureValue = shallowCopyStructureArray[item[0]][item[1]][0] + 1
                            shallowCopyStructureArray[item[0]][item[1]][0] = newStructureValue
                        }
                    })

                    shallowCopyStructureArray.splice(currentRowIndex + 1, 0, finalInsertArray)
    
                    setStructureArray(shallowCopyStructureArray)
                }
            }
        }
    }

    const handleCellMenu = (e: React.MouseEvent) : void => {
        if (!cellSelected) {
            return
        }
        // console.log((e.target as Element).id)
        const selectedCommand = (e.target as Element).id
        setCellMenuVisibility(false)
        const shallowCopyStructureArray = [...structureArray]
        const selectedColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const selectedRowIndex: number = parseInt(cellSelected.split('-')[1])
        if (selectedCommand === "merge-cell") {
            setMergeModalStatus(true)
        } else if (selectedCommand.includes('split')) {
            const columnStructure: number = structureArray[selectedRowIndex][selectedColumnIndex][1];
            const rowStructure: number = structureArray[selectedRowIndex][selectedColumnIndex][0];
            if (columnStructure === 1 && rowStructure === 1) {
                return
            } else {
                for (let i = 0; i < rowStructure; i++) {
                    for (let j = 0; j < columnStructure; j++) {
                        shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j][0] = 1;
                        shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j][1] = 1;
                    }
                }
            }
        }
        setStructureArray(shallowCopyStructureArray)
    }

    const handleMergeSubmit = (e: React.FormEvent<HTMLFormElement>) : void => {
        e.preventDefault()
        const newColumnStructureValue: number = parseInt(e.currentTarget.mergeColumnValue.value)
        const newRowStructureValue: number = parseInt(e.currentTarget.mergeRowValue.value)

        if (structureArray[parseInt(cellSelected.split('-')[1])][parseInt(cellSelected.split('-')[2])][0] !== 1) {
            return
        }

        if (newColumnStructureValue <= 1 && newRowStructureValue <= 1) {
            setMergeModalStatus(false)
            let form = document.getElementById('mergeForm')
            if(form) (form as HTMLFormElement).reset();
            return
        }

        const selectedColumnIndex: number = parseInt(cellSelected.split('-')[2])
        const selectedRowIndex: number = parseInt(cellSelected.split('-')[1])
        const shallowCopyStructureArray = [...structureArray]
        for (let i = 0; i < newRowStructureValue; i++) {
            for (let j = 0; j < newColumnStructureValue; j++) {
                if (i === 0 && j === 0) {
                    shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j] = [newRowStructureValue, newColumnStructureValue];
                } else {
                    shallowCopyStructureArray[selectedRowIndex + i][selectedColumnIndex + j] = [0, 0];
                }
            }
        }
        setStructureArray(shallowCopyStructureArray)
        setMergeModalStatus(false)
        let form = document.getElementById('mergeForm')
        if(form) (form as HTMLFormElement).reset();
    }

    const mergeModal = () => {
        if (mergeModalStatus) {
            return (
                <div className="merge-modal" id="merge-modal">
                    <form onSubmit={handleMergeSubmit} id="mergeForm">
                        <p>Merge tool:</p>
                        <p>Column span:</p><input type="number" id="merge-column" name="mergeColumnValue" defaultValue={1} />
                        <p>Row span:</p><input type="number" id="merge-row" name="mergeRowValue" defaultValue={1} />
                        <div>
                            <button type="submit">Merge</button>
                            <button onClick={() => setMergeModalStatus(false)}>Back</button>
                        </div>
                    </form>
                </div>
            )
        } else {
            return
        }
    }

    const renderCell = (rowIndex: number, columnIndex: number) => {
        const rowStructureValueAtIndex: number = structureArray[rowIndex][columnIndex][0]
        const columnStructureValueAtIndex: number = structureArray[rowIndex][columnIndex][1]
        if (rowStructureValueAtIndex === 0 && columnStructureValueAtIndex === 0) {
            return <></>
        } else {
            return (
                <td key={`${rowIndex}-${columnIndex}`} id={`cell-${rowIndex}-${columnIndex}`} className={isCellSelected(`cell-${rowIndex}-${columnIndex}`) ? "selectedCell" : "spreadsheet-tbody-tr-td"} onClick={handleOnSelected} colSpan={columnStructureValueAtIndex} rowSpan={rowStructureValueAtIndex} style={{textAlign: 'center'}}>
                {structureArray[rowIndex][columnIndex][0] > 1 || structureArray[rowIndex][columnIndex][1] > 1 ? `${structureArray[rowIndex][columnIndex][0]} x ${structureArray[rowIndex][columnIndex][1]}` : ''}
                </td>
            )
        }
    }

    return (
        <>
            <div className="spreadsheet-div">
                <div className="spreadsheet-menus-div">
                    <div className="row-dropdown" id='column-dropdown-div' onMouseEnter={() => setCellMenuVisibility(true)} onMouseLeave={() => setCellMenuVisibility(false)}>
                        <button className="row-dropbtn" id="cell-dropdown-button">Cell</button>
                        {cellMenuVisibility &&<div className="row-dropdown-content" id='cell-dropdown-content'>
                            <p id="merge-cell" onClick={handleCellMenu}>Merge</p>
                            <p id="split-cell" onClick={handleCellMenu}>Split</p>
                        </div>}
                    </div> 
                    <div className="row-dropdown" id='column-dropdown-div' onMouseEnter={() => setColumnMenuVisibility(true)} onMouseLeave={() => setColumnMenuVisibility(false)}>
                        <button className="row-dropbtn" id='column-dropdown-button'>Column</button>
                        {columnMenuVisibility && <div className="row-dropdown-content" id='column-dropdown-content'>
                            <p id="add-column-left" onClick={handleColumnMenu}>Add column (left)</p>
                            <p id="add-column-right" onClick={handleColumnMenu}>Add column (right)</p>
                            <p id="remove-column" onClick={handleColumnMenu}>Remove column</p>
                        </div>}
                    </div> 
                    <div className="row-dropdown" onMouseEnter={() => setRowMenuVisibility(true)} onMouseLeave={() => setRowMenuVisibility(false)}>
                        <button className="row-dropbtn">Row</button>
                        {rowMenuVisibility && <div className="row-dropdown-content" id='row-dropdown-content'>
                            <p id="add-row-above" onClick={handleRowMenu}>Add row (above)</p>
                            <p id="add-row-below" onClick={handleRowMenu}>Add row (below)</p>
                            <p id="remove-row" onClick={handleRowMenu}>Remove row</p>
                        </div>}
                    </div> 
                    <p style={{marginRight: '5px'}}><b>Selected Cell:</b></p>
                    <p>{cellSelected ? `${parseInt(cellSelected.split('-')[1]) + 1} - ${parseInt(cellSelected.split('-')[2]) + 1}` : "-"}</p>
                </div>

                <table className="spreadsheet-table">
                    <thead className="spreadsheet-thead">
                        <tr className="spreadsheet-thead-tr">
                        <th className="spreadsheet-thead-tr-td-first"></th>
                            {structureArray[0] && structureArray[0].map((_, index) => {
                                return (
                                    <th key={`header-${index}`} className="spreadsheet-thead-tr-td">{index + 1}</th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="spreadsheet-tbody">
                        {structureArray[0] && structureArray.map((row, rowIndex) => {
                            return (
                                <tr key={rowIndex} className="spreadsheet-tbody-tr">
                                    <th className="spreadsheet-tbody-tr-td-first">{rowIndex + 1}</th>
                                    {row.map((_, columnIndex) => {
                                        return renderCell(rowIndex, columnIndex)
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {mergeModal()}
        </>
    )
}

export default Spreadsheet;