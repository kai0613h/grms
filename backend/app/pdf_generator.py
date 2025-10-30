# pdf_generator.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Literal
import tempfile
import subprocess
from pathlib import Path

pdf_router = APIRouter()

# データモデル定義
class Presentation(BaseModel):
    id: int
    student_number: int
    student_name: str
    laboratory_id: int
    theme: str
    years_id: int

class Session(BaseModel):
    type: Literal['session', 'break']
    startTime: str
    endTime: str
    chair: Optional[str] = None
    timekeeper: Optional[str] = None
    presentations: Optional[List[Presentation]] = None

class ScheduleData(BaseModel):
    courseName: str
    eventName: str
    eventTheme: str
    dateTime: str
    venue: str
    sessions: List[Session]

def escape_latex(text: str) -> str:
    """LaTeX特殊文字をエスケープ"""
    if not text:
        return ''
    
    # バックスラッシュを最初に処理
    text = text.replace('\\', '\\textbackslash{}')
    
    # 特殊文字をエスケープ
    special_chars = {
        '&': '\\&',
        '%': '\\%',
        '$': '\\$',
        '#': '\\#',
        '_': '\\_',
        '{': '\\{',
        '}': '\\}',
        '~': '\\textasciitilde{}',
        '^': '\\textasciicircum{}'
    }
    
    for char, escaped in special_chars.items():
        text = text.replace(char, escaped)
    
    return text

def generate_latex(data: ScheduleData) -> str:
    """スケジュールデータからLaTeX文字列を生成"""
    presentation_counter = 1
    sessions_latex_parts = []
    
    for index, session in enumerate(data.sessions):
        session_title = f"{escape_latex(session.startTime)}〜{escape_latex(session.endTime)}"
        
        if session.type == 'break':
            sessions_latex_parts.append(
                f"\\section*{{Break({session_title})}}\n\\vspace{{0.5cm}}"
            )
        else:
            # セッション番号を計算
            session_number = sum(1 for i, s in enumerate(data.sessions) 
                                if s.type == 'session' and i <= index)
            
            chair = escape_latex(session.chair or '')
            timekeeper = escape_latex(session.timekeeper or '')
            
            # プレゼンテーションのリストを生成
            presentations_lines = []
            if session.presentations:
                for p in session.presentations:
                    line = f"  {presentation_counter}. & {escape_latex(p.student_name)} & {escape_latex(p.theme)} \\\\"
                    presentations_lines.append(line)
                    presentation_counter += 1
            
            presentations_latex = '\n'.join(presentations_lines)
            
            session_latex = f"""
\\section*{{Session {session_number}({session_title}){{\\normalsize 座長:{chair}、タイムキーパー:{timekeeper}}} }}
\\begin{{tabular}}{{rlp{{12cm}}}}
{presentations_latex}
\\end{{tabular}}
"""
            sessions_latex_parts.append(session_latex)
    
    sessions_latex = '\n\\vspace{0.5cm}\n'.join(sessions_latex_parts)
    
    # 完全なLaTeX文書を生成
    latex_content = f"""\\documentclass[dvipdfmx,a4j]{{jsarticle}}
\\usepackage[top=20truemm,bottom=20truemm,left=25truemm,right=25truemm]{{geometry}}
\\begin{{document}}
\\title{{{{\\normalsize {escape_latex(data.courseName)}}} \\\\
{{\\LARGE {escape_latex(data.eventName)}}} \\\\
{{\\Large {escape_latex(data.eventTheme)}}}}}
\\date{{\\empty}}
\\maketitle
\\vspace{{-1cm}}
\\noindent
\\hspace{{5cm}} 日時:{escape_latex(data.dateTime)} \\\\
\\hspace{{5cm}} 会場:{escape_latex(data.venue)}
\\vspace{{1cm}}
{sessions_latex}
\\end{{document}}
"""
    
    return latex_content

def compile_latex_to_pdf(latex_content: str) -> bytes:
    """LaTeX文字列をコンパイルしてPDFバイナリを返す"""
    
    # 一時ディレクトリを作成
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        tex_file = tmpdir_path / "document.tex"
        
        # LaTeXファイルを書き込み
        tex_file.write_text(latex_content, encoding='utf-8')
        
        try:
            # platex でコンパイル（日本語対応）
            subprocess.run(
                ['platex', '-interaction=nonstopmode', 'document.tex'],
                cwd=tmpdir,
                check=True,
                capture_output=True,
                timeout=30
            )
            
            # dvipdfmx で PDF に変換
            subprocess.run(
                ['dvipdfmx', 'document.dvi'],
                cwd=tmpdir,
                check=True,
                capture_output=True,
                timeout=30
            )
            
            # PDFファイルを読み込み
            pdf_file = tmpdir_path / "document.pdf"
            if not pdf_file.exists():
                raise FileNotFoundError("PDF file was not generated")
            
            return pdf_file.read_bytes()
            
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)
            raise HTTPException(
                status_code=500,
                detail=f"LaTeX compilation failed: {error_msg}"
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(
                status_code=500,
                detail="LaTeX compilation timed out"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error during PDF generation: {str(e)}"
            )

@pdf_router.post("/generate-pdf")
async def generate_pdf(data: ScheduleData):
    """スケジュールデータを受け取ってPDFを生成"""
    try:
        # LaTeXを生成
        latex_content = generate_latex(data)
        
        # PDFにコンパイル
        pdf_bytes = compile_latex_to_pdf(latex_content)
        
        # PDFを返す
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=program.pdf"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(e)}"
        )