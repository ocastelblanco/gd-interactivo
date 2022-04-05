import { Component, ViewChild, Input, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataService, Planificacion } from 'src/app/servicios/data.service';
import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';

interface DataFiltrada extends Planificacion {
  visible?: boolean;
}
interface FiltroBase {
  nombre: string;
  activo: boolean;
}
interface Filtro extends FiltroBase {
  titulo: string;
  filtros: FiltroBase[];
}

@Component({
  selector: 'gd-tabla',
  templateUrl: './tabla.component.html',
  styleUrls: ['./tabla.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TablaComponent implements OnInit {
  @Input() materia: string = 'ma';
  @Input() tema: string = 'Las fracciones';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  data: Planificacion[] = [];
  dataFiltrada: DataFiltrada[] = [];
  dataSource!: MatTableDataSource<Planificacion>;
  columnasPrincipal: string[] = ['plegar'];
  columnasDetalle: string[] = [];
  detalles: any;
  nombres: string[] = [];
  expandedElement!: any;
  abreDetalle: boolean[] = [];
  infoDetalle: any = {};
  anchoTablaDetalle: string = '';
  abreFiltroColumna: boolean[] = [];
  filtros: Filtro[] = [];
  filtroActivo: number = 0;
  faFileExcel = faFileExcel;
  faFilePdf = faFilePdf;
  constructor(private dataService: DataService) { }
  ngOnInit(): void {
    this.nombres = this.dataService.nombresEncabezados;
    this.columnasPrincipal = this.columnasPrincipal.concat(this.dataService.filaPrincipal);
    this.columnasDetalle = this.columnasDetalle.concat(this.dataService.filaDetalle);
    this.dataService.getData().subscribe(data => {
      this.data = data;
      this.abreDetalle = this.data.map(f => false);
      this.abreFiltroColumna = this.columnasPrincipal.map(f => false);
      this.dataSource = new MatTableDataSource(this.data);
      this.filtros = [];
      this.dataFiltrada = JSON.parse(JSON.stringify(data)) as DataFiltrada[];
      this.dataFiltrada.forEach(e => e.visible = true);
      this.columnasPrincipal.forEach((f: string) => {
        const filtros: FiltroBase[] = [];
        this.dataFiltrada.forEach((e: any) => {
          if (filtros.length === 0 || filtros.map(f => f.nombre).indexOf(e[f]) < 0) {
            filtros.push({ nombre: e[f], activo: true } as FiltroBase);
          }
        });
        //*
        filtros.sort((a: any, b: any) => {
          if (a.nombre < b.nombre) {
            return -1;
          }
          if (a.nombre > b.nombre) {
            return 1;
          }
          return 0;
        });
        //*/
        this.filtros.push({ titulo: f, filtros: filtros } as Filtro);
      });
      window.setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
    this.dataService.getDetalles().subscribe(detalles => this.detalles = detalles);
  }
  pliegaFila(element: any): void {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.anchoTablaDetalle = document.getElementById('tabla-detalle')?.offsetWidth + 'px';
  }
  abrirDetalle(fila: number, tipo: string, siglas: string): void {
    this.abreDetalle = this.abreDetalle.map(f => false);
    this.infoDetalle.data = [];
    const listaSiglas: string[] = siglas.split(';').map((f: string) => f.trim());
    this.detalles[tipo].data.forEach((f: string[]) => {
      const sigla = f[0].substring(f[0].length - 1) === '.' ? f[0].substring(0, f[0].length - 1) : f[0];
      listaSiglas.indexOf(sigla) !== -1 && this.infoDetalle.data.push(f);
    });
    const numEnc: number = this.columnasDetalle.indexOf(tipo) + this.columnasPrincipal.length;
    this.infoDetalle.titulo = this.nombres[numEnc];
    this.infoDetalle.encabezados = this.detalles[tipo].encabezados;
    this.abreDetalle[fila] = true;
  }
  abrirFiltro(columna: number): void {
    this.abreFiltroColumna = this.abreFiltroColumna.map(f => false);
    this.abreFiltroColumna[columna] = true;
  }
  aplicaFiltros(columna: number, aplica: boolean = false): void {
    const nomColum: string = this.columnasPrincipal[columna];
    this.abreFiltroColumna = this.abreFiltroColumna.map(f => false);
    if (aplica) {
      this.dataFiltrada.forEach((e: any) =>
        e.visible = this.filtros[columna].filtros.find(f => f.nombre === e[nomColum])?.activo
      );
      this.dataSource = new MatTableDataSource(this.dataFiltrada.filter(d => d.visible));
      this.dataSource.paginator = this.paginator;
      this.filtroActivo = this.esFiltroActivo(columna) ? columna : 0;
    }
    this.filtros[columna].filtros.forEach((f: any) => f.activo = this.dataFiltrada.filter((e: any) => e[nomColum] === f.nombre)[0].visible);
  }
  esFiltroActivo(numCol: number): boolean {
    return this.filtros[numCol].filtros.filter(f => !f.activo).length > 0;
  }
  algunosFiltros(columna: number): boolean {
    const filtros: FiltroBase[] = this.filtros[columna].filtros;
    const numFilAct: number = filtros.filter(f => f.activo).length;
    return numFilAct > 0 && numFilAct < filtros.length;
  }
  todosFiltros(columna: number): boolean {
    const filtros: FiltroBase[] = this.filtros[columna].filtros;
    const numFilAct: number = filtros.filter(f => f.activo).length;
    return numFilAct === filtros.length;
  }
  selTodosFiltros(columna: number, todos: boolean): void {
    this.filtros[columna].filtros.forEach(f => f.activo = todos);
  }
  esFiltroVisible(columna: number, nombre: string): boolean {
    const nomCol: string = this.columnasPrincipal[columna];
    return this.dataFiltrada.filter((f: any) => f[nomCol] === nombre)[0].visible ?? false;
  }
}