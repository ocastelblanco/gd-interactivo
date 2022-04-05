import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Planificacion {
  sesion: string;
  titulo: string;
  temporizacion: string;
  itinerarioBasico: string;
  tipoMedia: string;
  objetivos: string;
  saberesBasicos: string;
  conceptosClave: string;
  competenciasEspecificas: string;
  criteriosEvaluacion: string;
  criteriosRealizacion: string;
  competenciasClave: string;
  smartlink: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _dataSource: Planificacion[] = [];
  private dataSource: BehaviorSubject<Planificacion[]> = new BehaviorSubject<Planificacion[]>(this._dataSource);
  private _detalles: any = {};
  private detalles: BehaviorSubject<any> = new BehaviorSubject<any>(this._detalles);
  public nombresEncabezados: string[] = ['', 'Sesión', 'Título', 'Temporización', 'Itinerario básico', 'Tipo de media', 'Objetivos', 'Saberes básicos', 'Conceptos clave', 'Competencias específicas', 'Criterios de evaluacion', 'Criterios de realizacion', 'Competencias clave'];
  public filaPrincipal: string[] = ['sesion', 'titulo', 'temporizacion', 'itinerarioBasico', 'tipoMedia'];
  public filaDetalle: string[] = ['objetivos', 'saberesBasicos', 'conceptosClave', 'competenciasEspecificas', 'criteriosEvaluacion', 'criteriosRealizacion', 'competenciasClave'];
  constructor(private http: HttpClient) { }
  init(mat: string): void {
    const sepCSV: RegExp = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/gm;
    const main: string = 'assets/' + mat + '/main.csv';
    this._dataSource = [];
    this.http.get(main, { responseType: 'text' }).subscribe((data: string) => {
      const lines: string[] = data.split('\n');
      lines.forEach((line: string) => {
        const values: string[] | undefined = line.match(sepCSV)?.map(e => {
          let salida: string = e.replace(/"/g, '');
          if (salida.substring(0, 1) === ',') salida = salida.substring(1);
          return salida;
        });
        const planificacion: Planificacion = values ? {
          sesion: values[0],
          titulo: values[1],
          temporizacion: values[2],
          itinerarioBasico: values[3],
          tipoMedia: values[4],
          objetivos: values[5],
          saberesBasicos: values[6],
          conceptosClave: values[7],
          competenciasEspecificas: values[8],
          criteriosEvaluacion: values[9],
          criteriosRealizacion: values[10],
          competenciasClave: values[11],
          smartlink: values[12]
        } : {} as Planificacion;
        this._dataSource.push(planificacion);
      });
      if (this._dataSource.length === lines.length) this.dataSource.next(this._dataSource);
    });
    this.filaDetalle.forEach(detalle => {
      const detalleCSV: string = 'assets/' + mat + '/' + detalle + '.csv';
      this.http.get(detalleCSV, { responseType: 'text' }).subscribe((data: string) => {
        const detalles: any = {};
        const lines: string[] = data.split('\n');
        lines.forEach((line: string, index: number) => {
          const values: string[] | undefined = line.match(sepCSV)?.map(e => {
            let salida: string = e.replace(/"/g, '');
            if (salida.substring(0, 1) === ',') salida = salida.substring(1);
            return salida;
          });
          if (values) {
            if (index === 0) {
              detalles.encabezados = values;
              detalles.data = [];
            } else {
              detalles.data.push(values);
            }
          }
        });
        this._detalles[detalle] = detalles;
        if (Object.keys(this._detalles).length === this.filaDetalle.length) this.detalles.next(this._detalles);
      });
    });
  }
  getData(): BehaviorSubject<Planificacion[]> {
    return this.dataSource;
  }
  getDetalles(): BehaviorSubject<any> {
    return this.detalles;
  }
}
