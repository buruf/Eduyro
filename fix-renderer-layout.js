const fs = require('fs');
const f = 'src/lib/pdf/renderer.tsx';
let c = fs.readFileSync(f, 'utf8');

// Replace fixed 33% width with dynamic column calculation
// Also increase cell padding and font size when fewer columns

// Replace the static problemCell style
c = c.replace(
  `  problemGrid: { flexDirection: "row", flexWrap: "wrap" },
  problemCell: { width: "33%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 3, paddingHorizontal: 2 },`,
  `  problemGrid: { flexDirection: "row", flexWrap: "wrap" },
  problemCell1col: { width: "100%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 6, paddingHorizontal: 4 },
  problemCell2col: { width: "50%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 5, paddingHorizontal: 3 },
  problemCell3col: { width: "33%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 3, paddingHorizontal: 2 },
  problemText1col: { fontSize: 11, fontFamily: "Helvetica-Bold", flex: 1 },
  problemText2col: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },
  problemText3col: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },`
);

// Replace static problemText style
c = c.replace(
  `  problemText: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },`,
  ``
);

// Replace the problem grid rendering with dynamic columns
c = c.replace(
  `      {/* Problems grid */}
      <View style={styles.problemGrid}>
        {sheet.problems.map((p, i) => (
          <View key={p.id} style={styles.problemCell}>
            <Text style={styles.problemNum}>{i + 1}.</Text>
            <Text style={styles.problemText}>{(() => {
              const q = p.question;
              // Don't add = if question already has one, or is a word problem
              if (q.includes("=") || q.includes("?") || q.toLowerCase().startsWith("which") || 
                  q.toLowerCase().startsWith("what") || q.toLowerCase().startsWith("convert") ||
                  q.toLowerCase().startsWith("factor") || q.toLowerCase().startsWith("expand") ||
                  q.toLowerCase().startsWith("simplify") || q.toLowerCase().startsWith("add") ||
                  q.toLowerCase().startsWith("subtract") || q.toLowerCase().startsWith("in ")) {
                return q;
              }
              return q + " =";
            })()}</Text>
            {sheet.isAnswerKey ? (
              <View style={styles.answerBoxFilled}>
                <Text style={styles.answerText}>{String(p.answer)}</Text>
              </View>
            ) : (
              <View style={styles.answerBox} />
            )}
          </View>
        ))}
      </View>`,
  `      {/* Problems grid — dynamic columns based on problem count and question length */}
      {(() => {
        const count = sheet.problems.length;
        // Detect if questions are long (word problems)
        const avgLen = sheet.problems.reduce((s, p) => s + p.question.length, 0) / count;
        // Choose columns: long questions or few problems = fewer columns
        const cols = avgLen > 40 ? 1 : avgLen > 20 ? 2 : count <= 15 ? 2 : 3;
        const cellStyle = cols === 1 ? styles.problemCell1col : cols === 2 ? styles.problemCell2col : styles.problemCell3col;
        const textStyle = cols === 1 ? styles.problemText1col : cols === 2 ? styles.problemText2col : styles.problemText3col;
        return (
          <View style={styles.problemGrid}>
            {sheet.problems.map((p, i) => {
              const q = p.question;
              const displayQ = (q.includes("=") || q.includes("?") || q.toLowerCase().startsWith("which") ||
                q.toLowerCase().startsWith("what") || q.toLowerCase().startsWith("convert") ||
                q.toLowerCase().startsWith("factor") || q.toLowerCase().startsWith("expand") ||
                q.toLowerCase().startsWith("simplify") || q.toLowerCase().startsWith("add") ||
                q.toLowerCase().startsWith("subtract") || q.toLowerCase().startsWith("in ") ||
                q.toLowerCase().startsWith("a ") || q.toLowerCase().startsWith("two ") ||
                q.toLowerCase().startsWith("sam") || q.toLowerCase().startsWith("maria") ||
                q.toLowerCase().startsWith("someone") || q.toLowerCase().startsWith("there")) ? q : q + " =";
              return (
                <View key={p.id} style={cellStyle}>
                  <Text style={styles.problemNum}>{i + 1}.</Text>
                  <Text style={textStyle}>{displayQ}</Text>
                  {sheet.isAnswerKey ? (
                    <View style={styles.answerBoxFilled}>
                      <Text style={styles.answerText}>{String(p.answer)}</Text>
                    </View>
                  ) : (
                    <View style={styles.answerBox} />
                  )}
                </View>
              );
            })}
          </View>
        );
      })()}`
);

fs.writeFileSync(f, c);
const written = fs.readFileSync(f, 'utf8');
console.log('Dynamic columns:', written.includes('avgLen > 40'));
console.log('3 cell styles:', written.includes('problemCell3col'));
