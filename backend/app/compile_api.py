# backend/app/compile_api.py

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import subprocess
import tempfile
import os

router = APIRouter()

# リクエストのデータ型定義
class LatexSource(BaseModel):
    source: str

@router.post("/compile")
async def compile_latex(data: LatexSource):
    """
    受け取ったLaTeXソースコードをコンパイルしてPDFを返すAPI
    """
    tex_source = data.source

    # 一時フォルダを作ってそこで作業する（他の処理と混ざらないように）
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_file = os.path.join(tmpdir, "output.tex")
        dvi_file = os.path.join(tmpdir, "output.dvi")
        pdf_file = os.path.join(tmpdir, "output.pdf")

        # LaTeXソースをファイルに書き込む
        try:
            with open(tex_file, "w", encoding="utf-8") as f:
                f.write(tex_source)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to write tex file: {str(e)}")

        try:
            # 1. platex でコンパイル (.tex -> .dvi)
            # タイムアウトを30秒に設定
            proc_compile = subprocess.run(
                ["platex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30
            )

            if proc_compile.returncode != 0:
                # コンパイルエラー時、ログの一部を返す
                error_msg = proc_compile.stdout.decode('utf-8', errors='ignore')
                # エラーメッセージが長すぎると見づらいので後ろのほうだけ返す
                print(f"Compilation Error: {error_msg}")
                raise HTTPException(status_code=400, detail=f"LaTeX compilation failed. Check logs.")

            # 2. dvipdfmx でPDF変換 (.dvi -> .pdf)
            proc_pdf = subprocess.run(
                ["dvipdfmx", "-o", pdf_file, dvi_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30
            )

            if proc_pdf.returncode != 0:
                error_msg = proc_pdf.stderr.decode('utf-8', errors='ignore')
                raise HTTPException(status_code=400, detail=f"PDF conversion failed: {error_msg}")

            # 3. 生成されたPDFを読み込んで返す
            if os.path.exists(pdf_file):
                with open(pdf_file, "rb") as f:
                    pdf_content = f.read()
                
                # PDFファイルとしてレスポンスを返す
                return Response(content=pdf_content, media_type="application/pdf")
            else:
                raise HTTPException(status_code=500, detail="PDF output file not found.")

        except subprocess.TimeoutExpired:
             raise HTTPException(status_code=500, detail="Process timed out.")
        except Exception as e:
            # その他の予期せぬエラー
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))