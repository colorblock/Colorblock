const generateCells = (row) => {
  // 16 x 1 row to 16 x 16 matrix, 1 cell offset for per row
  const cells = row.map(cell => Array(16).fill(cell)).flat();
  return cells;
};

const exampleFrames = {
  width: 16,
  height: 16,
  activeId: 0,
  duration: 1,
  frameIds: [0, 1, 2, 3],
  frameList: {
    0: {
      id: 0,
      interval: 25,
      cells: generateCells(['rgba(239, 206, 148, 1)', 'rgba(249, 225, 159, 1)', 'rgba(255, 233, 204, 1)', 'rgba(255, 241, 198, 1)', 'rgba(255, 225, 201, 1)', 'rgba(255, 227, 193, 1)', 'rgba(255, 215, 188, 1)', 'rgba(249, 225, 189, 1)', 'rgba(239, 197, 139, 1)', 'rgba(252, 208, 179, 1)', 'rgba(255, 227, 175, 1)', 'rgba(242, 196, 118, 1)', 'rgba(252, 224, 191, 1)', 'rgba(244, 171, 139, 1)', 'rgba(252, 217, 141, 1)', 'rgba(255, 214, 196, 1)'])
    },
    1: {
      id: 1,
      interval: 50,
      cells: generateCells(['rgba(252, 123, 226, 1)', 'rgba(255, 158, 224, 1)', 'rgba(239, 129, 215, 1)', 'rgba(234, 107, 173, 1)', 'rgba(252, 141, 248, 1)', 'rgba(255, 175, 253, 1)', 'rgba(232, 178, 247, 1)', 'rgba(240, 192, 249, 1)', 'rgba(252, 189, 233, 1)', 'rgba(244, 161, 211, 1)', 'rgba(249, 127, 211, 1)', 'rgba(231, 161, 252, 1)', 'rgba(230, 173, 244, 1)', 'rgba(244, 124, 214, 1)', 'rgba(223, 139, 244, 1)', 'rgba(252, 199, 240, 1)'])
    },
    2: {
      id: 2,
      interval: 75,
      cells: generateCells(['rgba(214, 214, 214, 1)', 'rgba(173, 173, 173, 1)', 'rgba(183, 183, 183, 1)', 'rgba(188, 188, 188, 1)', 'rgba(191, 191, 191, 1)', 'rgba(196, 196, 196, 1)', 'rgba(127, 127, 127, 1)', 'rgba(181, 181, 181, 1)', 'rgba(150, 150, 150, 1)', 'rgba(255, 255, 255, 1)', 'rgba(183, 183, 183, 1)', 'rgba(196, 196, 196, 1)', 'rgba(211, 211, 211, 1)', 'rgba(140, 140, 140, 1)', 'rgba(137, 137, 137, 1)', 'rgba(150, 150, 150, 1)'])
    },
    3: {
      id: 3,
      interval: 100,
      cells: generateCells(['rgba(249, 207, 189, 1)', 'rgba(247, 173, 196, 1)', 'rgba(244, 139, 171, 1)', 'rgba(247, 131, 165, 1)', 'rgba(242, 140, 177, 1)', 'rgba(252, 176, 169, 1)', 'rgba(252, 147, 136, 1)', 'rgba(252, 138, 167, 1)', 'rgba(244, 151, 162, 1)', 'rgba(255, 196, 215, 1)', 'rgba(234, 146, 114, 1)', 'rgba(255, 165, 185, 1)', 'rgba(247, 121, 173, 1)', 'rgba(237, 134, 120, 1)', 'rgba(255, 117, 151, 1)', 'rgba(252, 188, 161, 1)'])
    },
  }
};

export default exampleFrames;