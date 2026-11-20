import os
import sys
import shutil
import subprocess
from pathlib import Path

def main():
    if len(sys.argv) < 3:
        print("Uso: python scripts/generate_3d.py <ruta_imagen_2d> <nombre_modelo_salida> [--bake-texture]")
        print("Ejemplo: python scripts/generate_3d.py art/titan.png boss_astral --bake-texture")
        sys.exit(1)

    input_img = Path(sys.argv[1]).resolve()
    model_name = sys.argv[2].replace(".glb", "")
    bake_texture = "--bake-texture" in sys.argv

    if not input_img.exists():
        print(f"Error: La imagen '{input_img}' no existe.")
        sys.exit(1)

    root_dir = Path(__file__).resolve().parent.parent
    triposr_dir = root_dir / "tools" / "TripoSR"
    python_exe = triposr_dir / ".venv" / "Scripts" / "python.exe"
    output_dir = triposr_dir / "output_tmp"
    models_dest_dir = root_dir / "packages" / "client" / "public" / "assets" / "models"
    models_dest_dir.mkdir(parents=True, exist_ok=True)

    if not python_exe.exists():
        print(f"Error: No se encontró el entorno de TripoSR en '{python_exe}'.")
        sys.exit(1)

    # Limpiar output temporal previo
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"============================================================")
    print(f" GENERADOR 3D TRIPOSR (RTX 2060 CUDA)")
    print(f" Imagen entrada : {input_img}")
    print(f" Modelo destino : {model_name}.glb")
    print(f"============================================================")

    cmd = [
        str(python_exe),
        "run.py",
        str(input_img),
        "--output-dir", str(output_dir),
        "--model-save-format", "glb",
        "--device", "cuda:0"
    ]

    if bake_texture:
        cmd.append("--bake-texture")

    print("[1/3] Ejecutando inferencia 3D en GPU...")
    res = subprocess.run(cmd, cwd=str(triposr_dir))
    if res.returncode != 0:
        print("Error generando el modelo 3D con TripoSR.")
        sys.exit(res.returncode)

    generated_glb = output_dir / "0" / "mesh.glb"
    if not generated_glb.exists():
        print(f"Error: No se encontró el archivo generado en '{generated_glb}'.")
        sys.exit(1)

    dest_file = models_dest_dir / f"{model_name}.glb"
    print(f"[2/3] Copiando modelo a assets del cliente: {dest_file}...")
    shutil.copy2(generated_glb, dest_file)

    file_size_mb = dest_file.stat().st_size / (1024 * 1024)
    print(f"[3/3] ¡Éxito! Modelo 3D disponible en el juego:")
    print(f" -> Ruta pública: /assets/models/{model_name}.glb ({file_size_mb:.2f} MB)")
    print(f"============================================================")

if __name__ == "__main__":
    main()
