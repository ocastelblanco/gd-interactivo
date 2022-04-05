import { Component, OnInit } from '@angular/core';
import { DataService, Planificacion } from 'src/app/servicios/data.service';

@Component({
  selector: 'gd-contenedor',
  templateUrl: './contenedor.component.html',
  styleUrls: ['./contenedor.component.scss']
})
export class ContenedorComponent implements OnInit {
  materia: string = 'ma';
  tema: string = 'Las fracciones';
  dataSource: Planificacion[] = [];
  constructor(private dataService: DataService) { }
  ngOnInit(): void {
    this.dataService.init(this.materia);
  }
}
